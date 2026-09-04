import { createPublicKey } from 'node:crypto';
import { query } from "./database";
import {
  verifyDomain,
  getDomainVerificationStatus,
  createConfigurationSet,
  enableDomainDkim,
  getDomainDkimTokens,
} from "./ses";
import {
  setupDomainDNS,
  verifyDomainOwnership,
  type DODomainRecord,
} from "./digitalocean";
import { getTenantById } from "./tenants";
import { getSesRegion } from "./ses";
import {
  getResolvedPlatformSettings,
  hasSesCredentials,
} from "./platform-settings";
import {
  allRequiredRecordsValid,
  checkDnsRecords,
  extractSesDkimTokens,
  generateDkimKeyPair,
  dnsRecordSignature,
  generateDualSendingDnsRecords,
  hasSendingLane,
  inferRecordLane,
  mergeDnsRecordStatuses,
  pemToBase64,
  recordsForLane,
  skipDnsVerification,
  type DnsRecord,
  type OutboundTransport,
} from "./dns-records";
import type { Domain } from "./database";

export type DNSRecord = DnsRecord;

export interface DomainSetupResult {
  domain: Domain;
  dnsRecords: DNSRecord[];
  sesConfigurationSet?: string;
  digitalOceanRecords?: DNSRecord[];
  setupInstructions: string;
}

// Helper function to safely parse DNS records (handles both string and object)
function safeParseDNSRecords(dnsRecords: unknown): DnsRecord[] {
  if (!dnsRecords) return [];
  if (typeof dnsRecords === "string") {
    try {
      return JSON.parse(dnsRecords);
    } catch {
      return [];
    }
  }
  if (Array.isArray(dnsRecords)) {
    return dnsRecords as DnsRecord[];
  }
  return [];
}

function toPublicDomain(row: Record<string, unknown>): Domain {
  const { dkim_private_key: _privateKey, ...rest } = row;
  return {
    ...(rest as unknown as Domain),
    dns_records: safeParseDNSRecords(row.dns_records),
    dkim_private_key: undefined,
  };
}

function publicKeyFromPrivate(pem: string): string {
  const exported = createPublicKey(pem).export({ type: "spki", format: "pem" });
  return pemToBase64(String(exported));
}

// Helper function to safely stringify JSON with circular reference protection
function safeJSONStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error("JSON stringify error:", error);
    console.error("Object causing error:", obj);
    // Try to create a safe version by copying only plain properties
    if (Array.isArray(obj)) {
      return JSON.stringify(
        obj.map((item: Record<string, unknown>) => ({
          type: item.type,
          name: item.name,
          value: item.value || item.data,
          ttl: item.ttl,
        }))
      );
    }
    return "[]";
  }
}

// Helper function to convert DODomainRecord to DNSRecord
function convertDORecordToDNSRecord(doRecord: DODomainRecord): DNSRecord {
  return {
    type: doRecord.type,
    name: doRecord.name,
    value: doRecord.data,
    ttl: doRecord.ttl,
    purpose: 'mx',
    required: false,
  };
}

export async function addDomain(
  userId: string,
  domainName: string,
  tenantId?: string,
): Promise<DomainSetupResult> {
  // Validate domain format
  if (!isValidDomain(domainName)) {
    throw new Error("Invalid domain format");
  }

  // Check if domain already exists in our database
  const existingDomain = await getDomainByName(domainName);
  if (existingDomain) {
    // If domain exists, check and complete its setup
    return await verifyAndCompleteExistingDomain(userId, existingDomain);
  }

  try {
    // 1. Verify domain with Amazon SES
    const sesVerification = await verifyDomain(domainName);

    // 2. Enable DKIM for the domain (optional - graceful fallback)
    let dkimTokens: string[] = [];
    try {
      dkimTokens = await enableDomainDkim(domainName);
      console.log(
        `DKIM enabled for ${domainName} with ${dkimTokens.length} tokens`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(`DKIM setup failed for ${domainName}:`, errorMessage);
      console.warn(
        "Continuing without DKIM (you can set it up manually in AWS SES console)"
      );
    }

    // 3. Create SES configuration set
    const configurationSet = await createConfigurationSet(domainName);

    const smtpPair = generateDkimKeyPair();
    const dnsRecords = generateDualSendingDnsRecords({
      domain: domainName,
      sesVerificationToken: sesVerification.verificationToken,
      sesDkimTokens: dkimTokens,
      dkimSelector: smtpPair.selector,
      dkimPublicKey: smtpPair.publicKeyBase64,
    });

    // 5. Setup DNS records in Digital Ocean (if configured)
    let digitalOceanRecords: DNSRecord[] = [];
    let setupInstructions = "";

    try {
      const isDomainInDO = await verifyDomainOwnership(domainName);
      if (isDomainInDO) {
        const doRecords = await setupDomainDNS(domainName, dnsRecords);
        digitalOceanRecords = doRecords.map(convertDORecordToDNSRecord);
        setupInstructions =
          "DNS records have been automatically created in Digital Ocean.";
      } else {
        setupInstructions = `Domain not found in Digital Ocean. Please create the DNS records manually or add the domain to your Digital Ocean account first.`;
      }
    } catch (error: unknown) {
      console.warn("Digital Ocean setup failed:", error);
      setupInstructions =
        "DNS records need to be created manually. Please add the following records to your DNS provider:";
    }

    if (!tenantId) {
      throw new Error('tenant_id is required to add a domain');
    }

    // 6. Store domain information in database
    const result = await query(
      `INSERT INTO domains
        (tenant_id, user_id, domain, status, ses_configuration_set, dns_records,
         verification_token, dkim_selector, dkim_private_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        tenantId,
        userId,
        domainName,
        "pending",
        configurationSet,
        safeJSONStringify(dnsRecords || []),
        sesVerification.verificationToken,
        smtpPair.selector,
        smtpPair.privateKeyPem,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create domain record");
    }

    const domain = {
      ...result.rows[0],
      dns_records: safeParseDNSRecords(result.rows[0].dns_records),
    };

    return {
      domain,
      dnsRecords,
      sesConfigurationSet: configurationSet,
      digitalOceanRecords,
      setupInstructions,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to add domain: ${errorMessage}`);
  }
}

async function verifyAndCompleteExistingDomain(
  userId: string,
  existingDomain: Domain
): Promise<DomainSetupResult> {
  // Check ownership
  if (existingDomain.user_id !== userId) {
    throw new Error("Domain belongs to another user");
  }

  const domainName = existingDomain.domain;
  let needsUpdate = false;
  const updateFields: Record<string, string> = {};
  let setupInstructions = "";
  let digitalOceanRecords: DNSRecord[] = [];

  try {
    // 1. Check SES domain status
    let sesStatus = "NotStarted";
    let sesVerificationToken = existingDomain.verification_token;

    try {
      sesStatus = await getDomainVerificationStatus(domainName);
      console.log(`SES status for ${domainName}: ${sesStatus}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("not exist") ||
        errorMessage.includes("not found")
      ) {
        // Domain doesn't exist in SES, need to verify it
        console.log(`Domain ${domainName} not found in SES, re-verifying...`);
        try {
          const sesVerification = await verifyDomain(domainName);
          sesVerificationToken = sesVerification.verificationToken;
          sesStatus = "Pending";
          needsUpdate = true;
          updateFields.verification_token = sesVerificationToken;
          console.log(`Re-verified domain ${domainName} in SES`);
        } catch (verifyError: unknown) {
          const verifyErrorMessage =
            verifyError instanceof Error
              ? verifyError.message
              : String(verifyError);
          console.warn(
            `Failed to re-verify domain in SES: ${verifyErrorMessage}`
          );
        }
      }
    }

    // 2. Check/setup DKIM
    let dkimTokens: string[] = [];
    try {
      dkimTokens = await getDomainDkimTokens(domainName);
      console.log(`Found ${dkimTokens.length} DKIM tokens for ${domainName}`);
    } catch {
      console.log(`DKIM not found for ${domainName}, attempting to enable...`);
      try {
        dkimTokens = await enableDomainDkim(domainName);
        console.log(
          `Enabled DKIM for ${domainName} with ${dkimTokens.length} tokens`
        );
      } catch (dkimError: unknown) {
        const dkimErrorMessage =
          dkimError instanceof Error ? dkimError.message : String(dkimError);
        console.warn(
          `Failed to enable DKIM for ${domainName}: ${dkimErrorMessage}`
        );
      }
    }

    // 3. Check/create SES configuration set
    let configurationSet = existingDomain.ses_configuration_set;
    if (!configurationSet) {
      try {
        configurationSet = await createConfigurationSet(domainName);
        needsUpdate = true;
        updateFields.ses_configuration_set = configurationSet;
        console.log(
          `Created configuration set for ${domainName}: ${configurationSet}`
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(`Failed to create configuration set: ${errorMessage}`);
      }
    }

    const smtpPair = existingDomain.dkim_private_key
      ? null
      : generateDkimKeyPair();
    if (smtpPair) {
      updateFields.dkim_selector = smtpPair.selector;
      updateFields.dkim_private_key = smtpPair.privateKeyPem;
      needsUpdate = true;
    }
    const dnsRecords = generateDualSendingDnsRecords({
      domain: domainName,
      sesVerificationToken: sesVerificationToken || '',
      sesDkimTokens: dkimTokens,
      dkimSelector: smtpPair?.selector || existingDomain.dkim_selector,
      dkimPublicKey: smtpPair
        ? smtpPair.publicKeyBase64
        : existingDomain.dkim_private_key
          ? publicKeyFromPrivate(existingDomain.dkim_private_key)
          : null,
    });
    needsUpdate = true;

    // 5. Check/setup Digital Ocean DNS
    try {
      const isDomainInDO = await verifyDomainOwnership(domainName);
      if (isDomainInDO) {
        console.log(
          `Domain ${domainName} found in Digital Ocean, checking DNS setup...`
        );
        try {
          const doRecords = await setupDomainDNS(domainName, dnsRecords);
          digitalOceanRecords = doRecords.map(convertDORecordToDNSRecord);
          setupInstructions =
            "DNS records have been verified/updated in Digital Ocean.";
        } catch (dnsError: unknown) {
          const dnsErrorMessage =
            dnsError instanceof Error ? dnsError.message : String(dnsError);
          console.warn(`DNS setup failed: ${dnsErrorMessage}`);
          setupInstructions =
            "DNS records need to be updated manually in Digital Ocean.";
        }
      } else {
        setupInstructions = `Domain not found in Digital Ocean. Please add the domain to your Digital Ocean account or create DNS records manually.`;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(`Digital Ocean check failed: ${errorMessage}`);
      setupInstructions =
        "Unable to verify Digital Ocean setup. Please check DNS records manually.";
    }

    // 6. Update database if needed
    if (needsUpdate) {
      const updateQuery = `
        UPDATE domains 
        SET ${Object.keys(updateFields)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(", ")}, 
            dns_records = $${Object.keys(updateFields).length + 2},
            updated_at = NOW()
        WHERE id = $1 
        RETURNING *`;

      const queryParams = [
        existingDomain.id,
        ...Object.values(updateFields),
        safeJSONStringify(dnsRecords || []),
      ];

      const result = await query(updateQuery, queryParams);

      if (result.rows.length > 0) {
        const updatedDomain = {
          ...result.rows[0],
          dns_records: safeParseDNSRecords(result.rows[0].dns_records),
        };

        return {
          domain: updatedDomain,
          dnsRecords,
          sesConfigurationSet: configurationSet,
          digitalOceanRecords,
          setupInstructions: `Domain already exists. ${setupInstructions}`,
        };
      }
    }

    // 7. Return existing domain with current setup info
    return {
      domain: existingDomain,
      dnsRecords,
      sesConfigurationSet: configurationSet,
      digitalOceanRecords,
      setupInstructions: `Domain already exists. ${setupInstructions}`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to verify existing domain setup: ${errorMessage}`);
  }
}

export async function getTenantDomains(tenantId: string): Promise<Domain[]> {
  try {
    const result = await query(
      `SELECT * FROM domains
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId],
    );

    const domains: Domain[] = [];
    for (const row of result.rows) {
      domains.push(await ensureDualDnsRecords(row as Domain));
    }
    return domains;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch domains: ${errorMessage}`);
  }
}

export async function getUserDomains(userId: string): Promise<Domain[]> {
  try {
    const result = await query(
      `SELECT * FROM domains 
 WHERE user_id = $1 
 ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => toPublicDomain(row));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch domains: ${errorMessage}`);
  }
}

export async function getDomainById(domainId: string): Promise<Domain | null> {
  try {
    const result = await query("SELECT * FROM domains WHERE id = $1 LIMIT 1", [
      domainId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    const domain = result.rows[0];
    return {
      ...domain,
      dns_records: safeParseDNSRecords(domain.dns_records),
    };
  } catch (error) {
    console.error("Get domain by ID error:", error);
    return null;
  }
}

export async function getDomainByName(
  domainName: string
): Promise<Domain | null> {
  try {
    const result = await query(
      "SELECT * FROM domains WHERE domain = $1 LIMIT 1",
      [domainName]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const domain = result.rows[0];
    return {
      ...domain,
      dns_records: safeParseDNSRecords(domain.dns_records),
    };
  } catch (error) {
    console.error("Get domain by name error:", error);
    return null;
  }
}

export async function updateDomainStatus(
  domainId: string,
  status: Domain["status"]
): Promise<void> {
  try {
    const result = await query("UPDATE domains SET status = $1 WHERE id = $2", [
      status,
      domainId,
    ]);

    if (result.rowCount === 0) {
      throw new Error("Domain not found");
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update domain status: ${errorMessage}`);
  }
}

export async function checkDomainVerification(
  domainId: string
): Promise<Domain["status"]> {
  const result = await verifyDomainDns(domainId);
  return result.status;
}

export async function verifyDomainDns(domainId: string): Promise<{
  status: Domain["status"];
  verified: boolean;
  records: DnsRecord[];
}> {
  const domain = await getDomainById(domainId);
  if (!domain) {
    throw new Error("Domain not found");
  }

  const tenant = await getTenantById(domain.tenant_id);
  const transport: OutboundTransport = tenant?.outbound_transport || "ses";
  const expected = await expectedRecordsForDomain(domain);
  const existing = safeParseDNSRecords(domain.dns_records);
  const prepared = mergeDnsRecordStatuses(expected.records, existing);
  const active = recordsForLane(prepared, transport);
  const inactive = prepared.filter(
    (record) => inferRecordLane(record) !== transport,
  );
  const checkedActive = await checkDnsRecords(active);
  const checked = [...checkedActive, ...inactive];
  const dnsOk = allRequiredRecordsValid(checkedActive);
  const skip = skipDnsVerification();

  let newStatus: Domain["status"] = "pending";
  if (skip) {
    newStatus = "verified";
  } else if (dnsOk) {
    newStatus = "verified";
    if (
      transport === "ses"
      && await hasSesCredentials()
    ) {
      try {
        const sesStatus = await getDomainVerificationStatus(domain.domain);
        if (sesStatus === "Failed") {
          newStatus = "failed";
        } else if (sesStatus !== "Success") {
          newStatus = "pending";
        }
      } catch (error) {
        console.warn("SES identity check failed:", error);
        newStatus = "pending";
      }
    }
  }

  await query(
    `UPDATE domains
     SET status = $2,
         dns_records = $3,
         dns_checked_at = NOW(),
         dkim_selector = COALESCE($4, dkim_selector),
         dkim_private_key = COALESCE($5, dkim_private_key)
     WHERE id = $1`,
    [
      domainId,
      newStatus,
      safeJSONStringify(checked),
      expected.dkimSelector || null,
      expected.dkimPrivateKey || null,
    ],
  );

  return {
    status: newStatus,
    verified: newStatus === "verified",
    records: checked,
  };
}

export async function deleteDomain(
  domainId: string,
  tenantId: string
): Promise<void> {
  const domain = await getDomainById(domainId);
  if (!domain || domain.tenant_id !== tenantId) {
    throw new Error("Domain not found or unauthorized");
  }

  try {
    await query("DELETE FROM api_keys WHERE domain_id = $1 AND tenant_id = $2", [
      domainId,
      tenantId,
    ]);

    const result = await query(
      "DELETE FROM domains WHERE id = $1 AND tenant_id = $2",
      [domainId, tenantId]
    );

    if (result.rowCount === 0) {
      throw new Error("Domain not found or unauthorized");
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete domain: ${errorMessage}`);
  }
}

export async function refreshAllDomainStatuses(): Promise<void> {
  try {
    const result = await query(
      "SELECT id, domain, status FROM domains WHERE status = 'pending'"
    );

    for (const domain of result.rows) {
      try {
        await checkDomainVerification(domain.id);
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Failed to check verification for domain ${domain.domain}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Failed to fetch pending domains:", error);
  }
}

export function isValidDomain(domain: string): boolean {
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

export function extractDomainFromEmail(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : "";
}

export async function validateEmailDomain(email: string): Promise<boolean> {
  const domain = extractDomainFromEmail(email);
  if (!domain) return false;

  const domainRecord = await getDomainByName(domain);
  return domainRecord?.status === "verified";
}

export async function registerTenantDomain(
  tenantId: string,
  userId: string,
  domainName: string,
): Promise<DomainSetupResult> {
  if (!isValidDomain(domainName)) {
    throw new Error('Invalid domain format');
  }

  const existing = await getDomainByName(domainName);
  if (existing) {
    if (existing.tenant_id !== tenantId) {
      throw new Error('Domain belongs to another tenant');
    }
    const publicDomain = toPublicDomain(existing as unknown as Record<string, unknown>);
    return {
      domain: publicDomain,
      dnsRecords: safeParseDNSRecords(existing.dns_records),
      setupInstructions: 'Domain already exists for this tenant.',
    };
  }

  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const normalized = domainName.toLowerCase();
  let verificationToken: string | null = null;
  let configurationSet: string | undefined;
  let sesDkimTokens: string[] = [];
  const pair = generateDkimKeyPair();
  const dkimSelector = pair.selector;
  const dkimPrivateKey = pair.privateKeyPem;
  const dkimPublicKey = pair.publicKeyBase64;
  let setupInstructions =
    'Publish every DNS record below. Sending stays blocked until MX, SPF, DKIM, and DMARC match.';

  if (await hasSesCredentials()) {
    try {
      const sesVerification = await verifyDomain(normalized);
      verificationToken = sesVerification.verificationToken;
      try {
        sesDkimTokens = await enableDomainDkim(normalized);
      } catch (error) {
        console.warn('DKIM setup failed:', error);
      }
      try {
        configurationSet = await createConfigurationSet(normalized);
      } catch (error) {
        console.warn('SES configuration set failed:', error);
      }
    } catch (error) {
      console.warn('SES domain verify failed:', error);
    }
  }

  const dnsRecords = generateDualSendingDnsRecords({
    domain: normalized,
    sesVerificationToken: verificationToken,
    sesDkimTokens,
    sesRegion: await getSesRegion(),
    smtpMxHost: tenant.smtp_upstream?.host,
    platformSmtpHost: await platformSmtpHost(),
    dkimSelector,
    dkimPublicKey,
  });

  try {
    const isDomainInDO = await verifyDomainOwnership(normalized);
    if (isDomainInDO) {
      await setupDomainDNS(
        normalized,
        recordsForLane(dnsRecords, tenant.outbound_transport).map((record) => ({
          type: record.type,
          name: record.name,
          value: record.value,
          ttl: record.ttl,
        })),
      );
      setupInstructions =
        'DNS records were created in Digital Ocean. Wait for them to propagate, then check verification.';
    }
  } catch (error) {
    console.warn('Digital Ocean setup skipped:', error);
  }

  const status = skipDnsVerification() ? 'verified' : 'pending';
  const result = await query(
    `INSERT INTO domains
      (tenant_id, user_id, domain, status, ses_configuration_set, dns_records,
       verification_token, dkim_selector, dkim_private_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      tenantId,
      userId,
      normalized,
      status,
      configurationSet || null,
      safeJSONStringify(dnsRecords),
      verificationToken,
      dkimSelector,
      dkimPrivateKey,
    ],
  );

  const domain = toPublicDomain(result.rows[0]);
  if (skipDnsVerification()) {
    setupInstructions +=
      ' SKIP_DNS_VERIFICATION is on, so sending is allowed locally before DNS matches.';
  }

  return {
    domain,
    dnsRecords,
    sesConfigurationSet: configurationSet,
    setupInstructions,
  };
}

async function platformSmtpHost(): Promise<string | null> {
  const platform = await getResolvedPlatformSettings();
  if (!platform.smtpEnabled || !platform.smtpHost) return null;
  return platform.smtpHost;
}

export async function refreshTenantSendingDns(tenantId: string): Promise<void> {
  const tenant = await getTenantById(tenantId);
  const transport: OutboundTransport = tenant?.outbound_transport || 'ses';
  const result = await query(
    `SELECT * FROM domains WHERE tenant_id = $1`,
    [tenantId],
  );
  for (const row of result.rows) {
    const domain = {
      ...(row as Domain),
      dns_records: safeParseDNSRecords(row.dns_records),
    };
    const expected = await expectedRecordsForDomain(domain);
    const existing = safeParseDNSRecords(domain.dns_records);
    const records = mergeDnsRecordStatuses(
      expected.records,
      existing,
      [transport],
    );
    await query(
      `UPDATE domains
       SET dns_records = $2,
           status = $3,
           dkim_selector = COALESCE($4, dkim_selector),
           dkim_private_key = COALESCE($5, dkim_private_key)
       WHERE id = $1`,
      [
        domain.id,
        safeJSONStringify(records),
        skipDnsVerification() ? 'verified' : 'pending',
        expected.dkimSelector || null,
        expected.dkimPrivateKey || null,
      ],
    );
    await verifyDomainDns(domain.id);
  }
}

async function ensureDualDnsRecords(row: Domain): Promise<Domain> {
  const existing = safeParseDNSRecords(row.dns_records);
  const domain = {
    ...row,
    dns_records: existing,
  };
  const expected = await expectedRecordsForDomain(domain);
  const records = mergeDnsRecordStatuses(expected.records, existing);
  const missingLane =
    !hasSendingLane(existing, 'ses') || !hasSendingLane(existing, 'smtp');
  const changed = dnsRecordSignature(records) !== dnsRecordSignature(existing);
  if (!missingLane && !changed) {
    return toPublicDomain({
      ...domain,
      dns_records: existing,
    } as unknown as Record<string, unknown>);
  }
  await query(
    `UPDATE domains
     SET dns_records = $2,
         dkim_selector = COALESCE($3, dkim_selector),
         dkim_private_key = COALESCE($4, dkim_private_key)
     WHERE id = $1`,
    [
      domain.id,
      safeJSONStringify(records),
      expected.dkimSelector || null,
      expected.dkimPrivateKey || null,
    ],
  );
  return toPublicDomain({
    ...domain,
    dns_records: records,
    dkim_selector: expected.dkimSelector || domain.dkim_selector,
  } as unknown as Record<string, unknown>);
}

async function expectedRecordsForDomain(domain: Domain): Promise<{
  records: DnsRecord[];
  dkimSelector?: string | null;
  dkimPrivateKey?: string | null;
}> {
  const tenant = await getTenantById(domain.tenant_id);
  const existing = safeParseDNSRecords(domain.dns_records);
  let dkimSelector = domain.dkim_selector || null;
  let dkimPrivateKey = domain.dkim_private_key || null;
  let dkimPublicKey: string | null = null;
  let sesDkimTokens = extractSesDkimTokens(existing);

  if (!dkimPrivateKey) {
    const pair = generateDkimKeyPair();
    dkimSelector = pair.selector;
    dkimPrivateKey = pair.privateKeyPem;
    dkimPublicKey = pair.publicKeyBase64;
  } else {
    dkimPublicKey = publicKeyFromPrivate(dkimPrivateKey);
  }

  if (await hasSesCredentials()) {
    try {
      const tokens = await getDomainDkimTokens(domain.domain);
      if (tokens.length > 0) {
        sesDkimTokens = tokens;
      }
    } catch (error) {
      console.warn('Could not refresh SES DKIM tokens:', error);
    }
  }

  return {
    records: generateDualSendingDnsRecords({
      domain: domain.domain,
      sesVerificationToken: domain.verification_token,
      sesDkimTokens,
      sesRegion: await getSesRegion(),
      smtpMxHost: tenant?.smtp_upstream?.host,
      platformSmtpHost: await platformSmtpHost(),
      dkimSelector,
      dkimPublicKey,
    }),
    dkimSelector,
    dkimPrivateKey,
  };
}
