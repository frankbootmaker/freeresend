export const LOCALES = ['en', 'de', 'hu'] as const;
export type Locale = (typeof LOCALES)[number];
export type Theme = 'dark' | 'light';

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  de: 'DE',
  hu: 'HU',
};

export function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'de' || value === 'hu';
}

export function isTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light';
}

type Dict = {
  loading: string;
  brand: string;
  brandBy: string;
  brandHome: string;
  prefs: {
    language: string;
    theme: string;
    dark: string;
    light: string;
    changeLanguage: string;
    toggleTheme: string;
  };
  landing: {
    login: string;
    getStarted: string;
    kicker: string;
    headline1: string;
    headline2: string;
    lede: string;
    createTenant: string;
    openConsole: string;
    edition: string;
    factsTitle1: string;
    factsTitle2: string;
    fact1Title: string;
    fact1Body: string;
    fact2Title: string;
    fact2Body: string;
    fact3Title: string;
    fact3Body: string;
    fact4Title: string;
    fact4Body: string;
    routeTitle: string;
    routeHttps: string;
    routeTenant: string;
    routeSmtp: string;
    routeEgress: string;
    nodeIngress: string;
    nodeTenant: string;
    nodeEgress: string;
    signal: string;
    footBrand: string;
    publicNav: string;
    sourceCredit: string;
  };
  login: {
    kickerStory: string;
    headline: string;
    story: string;
    meta: string;
    kickerPanel: string;
    title: string;
    lead: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    back: string;
    failed: string;
    createAccount: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    prefsAria: string;
    apiExampleAria: string;
    showPassword: string;
    hidePassword: string;
  };
  register: {
    kickerStory: string;
    headline: string;
    story: string;
    meta: string;
    kickerPanel: string;
    title: string;
    lead: string;
    org: string;
    operatorName: string;
    slug: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    back: string;
    failed: string;
    useExisting: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    prefsAria: string;
  };
  nav: {
    sending: string;
    domains: string;
    apiKeys: string;
    logs: string;
    customers: string;
    users: string;
    agents: string;
    health: string;
    backups: string;
    settings: string;
    signOut: string;
    switchTenant: string;
    tenantFallback: string;
    tabs: string;
    portal: string;
    openMenu: string;
    closeMenu: string;
    menu: string;
    tenantConsole: string;
    portalNav: string;
    crumbPrefix: string;
    platformCrumb: string;
    backToTenant: (name: string) => string;
    backToConsole: string;
    guide: string;
  };
  changelog: {
    title: string;
    lead: string;
    close: string;
    current: string;
    added: string;
    changed: string;
    fixed: string;
    openNotes: string;
  };
  sending: {
    kicker: string;
    title: string;
    lead: string;
    quota: string;
    used: (n: number) => string;
    loading: string;
    volume: string;
    volumeHint: string;
    upstream: string;
    upstreamAria: string;
    sesHint: string;
    smtpHint: string;
    host: string;
    port: string;
    username: string;
    password: string;
    tls: string;
    save: string;
    saved: string;
    saveFailed: string;
    firstRequest: string;
    firstRequestHint: string;
    ingress: string;
    ingressAria: string;
    httpsHint: string;
    smtpIngressHint: string;
    bothHint: string;
    smtpSubmit: string;
    smtpSubmitHint: string;
    smtpUser: string;
    smtpPassHint: string;
    ingressPolicy: string;
    egressConnector: string;
    https: string;
    smtp: string;
    both: string;
    publicApiUrl: string;
    smtpHost: string;
    smtpPort: string;
    tlsMode: string;
    tlsRequired: string;
    tlsOpportunistic: string;
    amazonSes: string;
    smtpRelay: string;
    secret: string;
    awsRegion: string;
    configSet: string;
    accessKey: string;
    secretKey: string;
    saveRoute: string;
    platformRelayHint: string;
  };
  customers: {
    kicker: string;
    title: string;
    lead: string;
    org: string;
    ownerEmail: string;
    tempPassword: string;
    domain: string;
    ingress: string;
    egress: string;
    provision: string;
    registry: string;
    name: string;
    slug: string;
    status: string;
    created: (slug: string) => string;
    apiKey: string;
    mcpToken: string;
    failed: string;
    open: string;
    opening: string;
    domainOptional: string;
    provisionAction: string;
    organization: string;
    route: string;
    state: string;
    bothIngress: string;
    passwordPlaceholder: string;
  };
  users: {
    addTitle: string;
    addLead: string;
    name: string;
    namePlaceholder: string;
    email: string;
    password: string;
    passwordPlaceholder: string;
    addAction: string;
    adding: string;
    created: string;
    promoted: string;
    registry: string;
    empty: string;
    added: string;
    you: string;
    setPassword: string;
    newPassword: string;
    savePassword: string;
    passwordUpdated: string;
    cancel: string;
    revoke: string;
    revoking: string;
    revoked: string;
    failed: string;
  };
  agents: {
    addTitle: string;
    platformLead: string;
    tenantLead: string;
    endpoint: string;
    name: string;
    namePlaceholder: string;
    addAction: string;
    adding: string;
    registry: string;
    empty: string;
    prefix: string;
    lastUsed: string;
    added: string;
    copyOnce: string;
    copy: string;
    copied: string;
    copyFailed: string;
    revoke: string;
    revoking: string;
    confirmRevoke: string;
    failed: string;
  };
  portal: {
    kicker: string;
    title: string;
    lead: string;
  };
  settings: {
    title: string;
    sesTitle: string;
    sesLead: string;
    smtpTitle: string;
    smtpLead: string;
    smtpEnabled: string;
    smtpDisabled: string;
    ingressTitle: string;
    ingressLead: string;
    listenPorts: string;
    port2525: string;
    port587: string;
    port465: string;
    ingressTls: string;
    tlsOff: string;
    tlsStarttls: string;
    tlsRequired: string;
    tlsCert: string;
    tlsKey: string;
    tlsHint: string;
    tlsSource: string;
    tlsLetsEncrypt: string;
    tlsManual: string;
    tlsDomain: string;
    tlsLeHint: string;
    tlsChallenge: string;
    tlsChallengeHttp: string;
    tlsChallengeDo: string;
    tlsChallengeIsp: string;
    tlsChallengeDns: string;
    tlsHttpHint: string;
    tlsDoHint: string;
    tlsIspHint: string;
    tlsDnsHint: string;
    tlsIspUrl: string;
    tlsIspUser: string;
    tlsIspPassword: string;
    tlsIspTls: string;
    tlsIspSecure: string;
    tlsIspInsecure: string;
    tlsManualHint: string;
    tlsStatusIdle: string;
    tlsStatusPending: string;
    tlsStatusWaitingDns: string;
    tlsStatusIssued: string;
    tlsStatusError: string;
    tlsExpiresOn: (when: string) => string;
    tlsRenewsOn: (when: string) => string;
    tlsIssueNow: string;
    tlsIssuing: string;
    tlsNoCertYet: string;
    tlsDnsRecordName: string;
    tlsDnsRecordValue: string;
    tlsDnsContinue: string;
    tlsDnsContinuing: string;
    alertTitle: string;
    alertLead: string;
    alertEmail: string;
    alertFrom: string;
    save: string;
    saved: string;
    saveFailed: string;
    secretSet: string;
    testTitle: string;
    testLead: string;
    testVia: string;
    testFrom: string;
    testTo: string;
    testSend: string;
    testSending: string;
    testSent: (via: string, id: string) => string;
    testFailed: string;
    testSmtpDisabled: string;
  };
  health: {
    title: string;
    lead: string;
    refresh: string;
    loading: string;
    failed: string;
    checkedAt: (when: string) => string;
    checks: string;
    database: string;
    ses: string;
    smtp: string;
    backup: string;
    ok: string;
    warn: string;
    down: string;
    off: string;
    degraded: string;
    latency: (ms: number) => string;
    region: (name: string) => string;
    sesQuota: (sent: number, max: number) => string;
    detailReachable: string;
    detailSesOk: string;
    detailSesMissing: string;
    detailSesFallback: string;
    detailSmtpOff: string;
    detailSmtpNoHost: string;
    detailNotChecked: string;
    detailBackupFresh: string;
    detailBackupStale: string;
    detailBackupFailed: string;
    detailBackupMissing: string;
    detailBackupSchedulerMissing: string;
    lastDump: (when: string) => string;
    volume24h: string;
    volume7d: string;
    total: string;
    sent: string;
    delivered: string;
    pending: string;
    bounced: string;
    complained: string;
    failedStatus: string;
    inventory: string;
    tenants: string;
    active: string;
    domains: string;
    verified: string;
    pendingDomains: string;
    failedDomains: string;
    topTenants: string;
    emptyTenants: string;
    recentFailures: string;
    emptyFailures: string;
    when: string;
    tenant: string;
    from: string;
    to: string;
    subject: string;
    status: string;
  };
  tabs: {
    domainsTitle: string;
    apiKeysTitle: string;
    logsTitle: string;
    logsLead: string;
  };
  domains: {
    kicker: string;
    lead: string;
    add: string;
    adding: string;
    placeholder: string;
    empty: string;
    records: string;
    check: string;
    checking: string;
    copy: string;
    type: string;
    name: string;
    value: string;
    purpose: string;
    status: string;
    valid: string;
    invalid: string;
    pending: string;
    verified: string;
    failed: string;
    cannotSend: string;
    delete: string;
    confirmDelete: string;
    added: string;
    hide: string;
    dnsTitle: string;
    sesRecords: string;
    smtpRecords: string;
    noDomainYet: string;
    emptyTitle: string;
    expectedValue: string;
    host: string;
    state: string;
    addFailed: string;
    verifyFailed: string;
    deleteFailed: string;
    copyFailed: string;
  };
  keys: {
    title: string;
    create: string;
    createSubmit: string;
    creating: string;
    copyOnce: string;
    copy: string;
    copied: string;
    copyFailed: string;
    domain: string;
    selectDomain: string;
    label: string;
    labelPlaceholder: string;
    cancel: string;
    emptyTitle: string;
    emptyBody: string;
    prefix: string;
    scope: string;
    lastUsed: string;
    confirmDelete: string;
    needVerified: string;
    chooseFields: string;
    createFailed: string;
    deleteFailed: string;
    delete: string;
    minutesAgo: (n: number) => string;
    hoursAgo: (n: number) => string;
  };
  logs: {
    title: string;
    search: string;
    anyStatus: string;
    delivered: string;
    bounced: string;
    sent: string;
    failed: string;
    complained: string;
    apply: string;
    emptyTitle: string;
    emptyBody: string;
    subject: string;
    recipient: string;
    status: string;
    domain: string;
    sentAt: string;
    previous: string;
    next: string;
    pageOf: (page: number, total: number) => string;
    details: string;
    from: string;
    to: string;
    created: string;
    textContent: string;
    close: string;
    noSubject: string;
    loadFailed: string;
  };
  portalLogs: {
    searchTitle: string;
    searchLead: string;
    anyTenant: string;
    retainTitle: string;
    retainLead: string;
    keepDays: string;
    stripDays: string;
    saveRetention: string;
    rotateNow: string;
    exportOps: string;
    retentionSaved: string;
    rotated: (purged: number, stripped: number) => string;
    lastRotate: (when: string, purged: number, stripped: number) => string;
    failed: string;
  };
  backups: {
    statusTitle: string;
    statusLead: string;
    lastSuccess: string;
    scheduler: string;
    schedulerMissing: string;
    lastOffsite: string;
    stale: string;
    exportNow: string;
    exported: string;
    scheduleTitle: string;
    scheduleEnabled: string;
    interval: string;
    saveSchedule: string;
    scheduleSaved: string;
    on: string;
    off: string;
    retentionTitle: string;
    keepDaily: string;
    keepWeekly: string;
    keepMonthly: string;
    autoRotate: string;
    saveRetention: string;
    retentionSaved: string;
    artifactsTitle: string;
    emptyTitle: string;
    emptyBody: string;
    artifact: string;
    size: string;
    modified: string;
    download: string;
    push: string;
    delete: string;
    deleted: string;
    pushed: string;
    importTitle: string;
    importLead: string;
    importFile: string;
    confirmReplace: string;
    importNow: string;
    imported: string;
    offsiteTitle: string;
    offsiteLead: string;
    offsiteEnabled: string;
    endpoint: string;
    region: string;
    bucket: string;
    prefix: string;
    accessKey: string;
    secretKey: string;
    pathStyle: string;
    saveOffsite: string;
    offsiteSaved: string;
    testOffsite: string;
    testOk: string;
    pushLatest: string;
    failed: string;
  };
};

const en: Dict = {
  loading: 'Loading RelayHorizon…',
  brand: 'RelayHorizon',
  brandBy: 'by Nethorizon',
  brandHome: 'RelayHorizon home',
  prefs: {
    language: 'Language',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    changeLanguage: 'Change language',
    toggleTheme: 'Toggle theme',
  },
  landing: {
    login: 'Sign in',
    getStarted: 'Deploy RelayHorizon',
    kicker: 'Option 2 — Operations',
    headline1: 'Outbound email.',
    headline2: 'Inside your perimeter.',
    lede:
      'Multi-tenant delivery infrastructure with Resend-compatible HTTPS, SMTP ingress, and explicit SES or relay egress.',
    createTenant: 'Configure your installation',
    openConsole: 'Open console',
    edition: 'Infrastructure should be legible before it is magical.',
    factsTitle1: 'Three facts.',
    factsTitle2: 'Nothing hidden.',
    fact1Title: 'Known API',
    fact1Body: 'Resend-compatible requests',
    fact2Title: 'Clear tenancy',
    fact2Body: 'Provisioned customer boundaries',
    fact3Title: 'Owned ingress',
    fact3Body: 'HTTPS and SMTP listeners',
    fact4Title: 'Chosen egress',
    fact4Body: 'SES or standard SMTP',
    routeTitle: 'Active route / acme-production',
    routeHttps: 'HTTPS API :443',
    routeTenant: 'acme-labs',
    routeSmtp: 'SMTP :587',
    routeEgress: 'SES eu-central-1',
    nodeIngress: 'INGRESS',
    nodeTenant: 'TENANT',
    nodeEgress: 'EGRESS',
    signal: 'All systems operational',
    footBrand: 'RelayHorizon. by Nethorizon',
    publicNav: 'Public',
    sourceCredit: 'Source credit: FreeResend',
  },
  login: {
    kickerStory: 'RelayHorizon console',
    headline: 'Return to the sending room.',
    story:
      'Sign in to manage upstreams, domains, API keys, quotas, and delivery traffic across your tenants.',
    meta: 'HTTPS / SES / SMTP / MCP',
    kickerPanel: 'Secure access',
    title: 'Operator sign in',
    lead: 'Authenticate to continue to the tenant console.',
    email: 'Work email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    back: 'Back',
    failed: 'Login failed',
    createAccount: 'Create operator account',
    emailPlaceholder: 'operator@company.test',
    passwordPlaceholder: '12 characters minimum',
    prefsAria: 'Sign-in preferences',
    apiExampleAria: 'API example',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  register: {
    kickerStory: 'RelayHorizon console',
    headline: 'Give your outbound system a boundary.',
    story:
      'Create one isolated tenant. Choose the upstream later, rotate keys without interruption, and keep every delivery trace accountable.',
    meta: 'HTTPS / SES / SMTP / MCP',
    kickerPanel: 'New organization',
    title: 'Initialize account',
    lead: 'Set the first control-plane identity.',
    org: 'Organization',
    operatorName: 'Operator name',
    slug: 'Tenant slug',
    email: 'Work email',
    password: 'Password',
    submit: 'Create account',
    submitting: 'Creating…',
    back: 'Back',
    failed: 'Registration failed',
    useExisting: 'Use an existing account',
    namePlaceholder: 'Mara Varga',
    emailPlaceholder: 'operator@company.test',
    passwordPlaceholder: '12 characters minimum',
    prefsAria: 'Account preferences',
  },
  nav: {
    sending: 'Sending',
    domains: 'Domains',
    apiKeys: 'API Keys',
    logs: 'Logs',
    customers: 'Customers',
    users: 'Users',
    agents: 'Agents',
    health: 'Health',
    backups: 'Backups',
    settings: 'Configuration',
    signOut: 'Sign out',
    switchTenant: 'Switch tenant',
    tenantFallback: 'Tenant',
    tabs: 'Tenant navigation',
    portal: 'Platform portal',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    menu: 'Menu',
    tenantConsole: 'Tenant console',
    portalNav: 'Platform portal',
    crumbPrefix: 'NETHORIZON /',
    platformCrumb: 'PLATFORM',
    backToTenant: (name) => `← ${name} tenant`,
    backToConsole: '← Tenant console',
    guide: 'Guide',
  },
  changelog: {
    title: 'Release notes',
    lead: 'What changed in this installation. Newest first.',
    close: 'Close',
    current: 'This installation',
    added: 'Added',
    changed: 'Changed',
    fixed: 'Fixed',
    openNotes: 'Open release notes',
  },
  sending: {
    kicker: 'Tenant / sending',
    title: 'Sending',
    lead:
      'Choose how applications hand mail to RelayHorizon, then how RelayHorizon delivers it.',
    quota: 'Monthly quota',
    used: (n) => `${n} used this month`,
    loading: 'Loading…',
    volume: '30-day volume',
    volumeHint: 'Logged sends for this tenant',
    upstream: 'Delivery upstream',
    upstreamAria: 'Delivery upstream',
    sesHint: 'HTTPS to Amazon SES',
    smtpHint: 'Host + credentials',
    host: 'Host',
    port: 'Port',
    username: 'Username',
    password: 'Password',
    tls: 'Require TLS',
    save: 'Save upstream',
    saved: 'Sending route saved.',
    saveFailed: 'Save failed',
    firstRequest: 'HTTPS request',
    firstRequestHint: 'The HTTPS endpoint follows Resend’s request shape.',
    ingress: 'How apps submit',
    ingressAria: 'Ingress',
    httpsHint: 'Resend-compatible POST /api/emails',
    smtpIngressHint: 'SMTP submission on 587 (also 2525). Username relayhorizon, password is an API key.',
    bothHint: 'Accept both HTTPS and SMTP',
    smtpSubmit: 'SMTP submission',
    smtpSubmitHint: 'Username is relayhorizon. Password is an API key.',
    smtpUser: 'Username',
    smtpPassHint: 'Password: your API key (frs_…)',
    ingressPolicy: 'Ingress policy',
    egressConnector: 'Egress connector',
    https: 'HTTPS',
    smtp: 'SMTP',
    both: 'Both',
    publicApiUrl: 'Public API URL',
    smtpHost: 'SMTP host',
    smtpPort: 'SMTP port',
    tlsMode: 'TLS mode',
    tlsRequired: 'Required',
    tlsOpportunistic: 'Opportunistic',
    amazonSes: 'Amazon SES',
    smtpRelay: 'SMTP relay',
    secret: 'Secret',
    awsRegion: 'AWS region',
    configSet: 'Configuration set',
    accessKey: 'Access key ID',
    secretKey: 'Secret access key',
    saveRoute: 'Save route',
    platformRelayHint:
      'Leave host empty to send through the platform SMTP relay.',
  },
  customers: {
    kicker: 'Portal administration',
    title: 'Customers',
    lead: 'Provision isolated organizations, establish ownership, and assign outbound egress.',
    org: 'Organization',
    ownerEmail: 'Owner email',
    tempPassword: 'Temporary password',
    domain: 'Domain',
    ingress: 'Ingress',
    egress: 'Egress',
    provision: 'Provision tenant',
    registry: 'Tenant registry',
    name: 'Name',
    slug: 'Slug',
    status: 'Status',
    created: (slug) => `Created ${slug}. Store secrets now:`,
    apiKey: 'API key',
    mcpToken: 'MCP token',
    failed: 'Create failed',
    open: 'Open tenant',
    opening: 'Opening…',
    domainOptional: 'Domain (optional)',
    provisionAction: 'Provision',
    organization: 'Organization',
    route: 'Route',
    state: 'State',
    bothIngress: 'HTTPS + SMTP',
    passwordPlaceholder: 'Initial credential',
  },
  users: {
    addTitle: 'Add platform user',
    addLead:
      'Create a new operator or grant portal access to an existing account.',
    name: 'Name',
    namePlaceholder: 'Ada Lovelace',
    email: 'Email',
    password: 'Password',
    passwordPlaceholder: 'Required for a new account, 8+ characters',
    addAction: 'Add user',
    adding: 'Adding…',
    created: 'Platform user created. They can sign in to the portal.',
    promoted: 'Existing account granted portal access.',
    registry: 'Platform users',
    empty: 'No platform administrators yet.',
    added: 'Added',
    you: 'you',
    setPassword: 'Password',
    newPassword: 'New password',
    savePassword: 'Save',
    passwordUpdated: 'Password updated.',
    cancel: 'Cancel',
    revoke: 'Revoke',
    revoking: 'Revoking…',
    revoked: 'Platform access revoked.',
    failed: 'User update failed',
  },
  agents: {
    addTitle: 'Add agent',
    platformLead:
      'A platform agent can use the same portal APIs as an administrator. Point an MCP client at the endpoint with this token.',
    tenantLead:
      'A tenant agent can only see this organization. Point an MCP client at the endpoint with this token.',
    endpoint: 'MCP endpoint',
    name: 'Name',
    namePlaceholder: 'Ops copilot',
    addAction: 'Create agent',
    adding: 'Creating…',
    registry: 'Agents',
    empty: 'No agents yet.',
    prefix: 'Prefix',
    lastUsed: 'Last used',
    added: 'Added',
    copyOnce: 'Copy this token now. It is not shown again.',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Could not copy the token',
    revoke: 'Revoke',
    revoking: 'Revoking…',
    confirmRevoke: 'Revoke this agent token? Connected clients will stop working.',
    failed: 'Agent update failed',
  },
  portal: {
    kicker: 'Nethorizon / portal',
    title: 'Portal',
    lead: 'Provision customers here. Open a tenant to use their sending console.',
  },
  settings: {
    title: 'Configuration',
    sesTitle: 'Amazon SES',
    sesLead:
      'Installation credentials for tenant SES egress and domain verification.',
    smtpTitle: 'SMTP relay',
    smtpLead:
      'Shared outbound relay for tenants that choose SMTP and do not set their own upstream.',
    smtpEnabled: 'Enabled',
    smtpDisabled: 'Disabled',
    ingressTitle: 'SMTP submission',
    ingressLead:
      'Ports the inbound listener binds. 587 uses STARTTLS when a certificate is set; 465 is implicit TLS. 2525 stays useful for local clients. Save, then keep the SMTP process running — it reloads these settings.',
    listenPorts: 'Listen ports',
    port2525: '2525',
    port587: '587',
    port465: '465',
    ingressTls: 'Inbound TLS',
    tlsOff: 'Off',
    tlsStarttls: 'STARTTLS',
    tlsRequired: 'Required',
    tlsCert: 'Certificate (PEM)',
    tlsKey: 'Private key (PEM)',
    tlsHint:
      'Let’s Encrypt issues and renews a certificate for the hostname below. Switch to Manual to paste PEMs.',
    tlsSource: 'Certificate',
    tlsLetsEncrypt: 'Let’s Encrypt',
    tlsManual: 'Manual',
    tlsDomain: 'Hostname',
    tlsLeHint:
      'Behind Traefik or Dokploy, prefer DNS TXT. HTTP-01 only works if that hostname reaches this portal on port 80, including /.well-known/acme-challenge.',
    tlsChallenge: 'Validation',
    tlsChallengeHttp: 'HTTP-01',
    tlsChallengeDo: 'DigitalOcean DNS',
    tlsChallengeIsp: 'ISPConfig',
    tlsChallengeDns: 'DNS TXT',
    tlsHttpHint:
      'Let’s Encrypt must reach http://hostname/.well-known/acme-challenge on this app. Traefik often intercepts that path — use DNS TXT on Dokploy unless you forward it.',
    tlsDoHint:
      'Creates _acme-challenge automatically when the hostname’s zone is in DigitalOcean (DO_API_TOKEN). Renews on its own.',
    tlsIspHint:
      'Uses the ISPConfig Remote JSON API to create the TXT record. The remote user needs DNS zone, DNS TXT, and client permissions. Renews on its own.',
    tlsIspUrl: 'ISPConfig API URL',
    tlsIspUser: 'Remote user',
    tlsIspPassword: 'Remote password',
    tlsIspTls: 'Panel TLS',
    tlsIspSecure: 'Verify',
    tlsIspInsecure: 'Allow insecure',
    tlsDnsHint:
      'Add the TXT record at your DNS host, wait a minute, then continue. Renewals need the same step — they are not fully automatic.',
    tlsManualHint:
      'Paste a certificate and key, or set SMTP_TLS_CERT_PATH and SMTP_TLS_KEY_PATH.',
    tlsStatusIdle: 'No certificate yet. Save a public hostname to issue one.',
    tlsStatusPending: 'Requesting a certificate from Let’s Encrypt…',
    tlsStatusWaitingDns: 'Add the TXT record below, then continue.',
    tlsStatusIssued: 'Certificate issued',
    tlsStatusError: 'Certificate request failed',
    tlsExpiresOn: (when) => `Expires ${when}`,
    tlsRenewsOn: (when) => `Next renewal ${when}`,
    tlsIssueNow: 'Issue / renew now',
    tlsIssuing: 'Requesting…',
    tlsNoCertYet: 'No certificate stored yet.',
    tlsDnsRecordName: 'TXT name',
    tlsDnsRecordValue: 'TXT value',
    tlsDnsContinue: 'I added the record',
    tlsDnsContinuing: 'Checking DNS…',
    alertTitle: 'Monitoring and alerts',
    alertLead:
      'Operational notices, including waitlist and delivery alerts, go to this address.',
    alertEmail: 'Alert email',
    alertFrom: 'From address',
    save: 'Save configuration',
    saved: 'Platform configuration saved.',
    saveFailed: 'Save failed',
    secretSet: 'Stored — enter a new value to rotate',
    testTitle: 'Test send',
    testLead:
      'Save configuration first. Choose SES or SMTP. From must be a SES-verified identity when using SES.',
    testVia: 'Outbound',
    testFrom: 'From',
    testTo: 'To',
    testSend: 'Send test email',
    testSending: 'Sending…',
    testSent: (via, id) => `Sent via ${via}. Message ID ${id}`,
    testFailed: 'Test send failed',
    testSmtpDisabled: 'Enable SMTP relay to test this path',
  },
  health: {
    title: 'Health',
    lead: 'Database, egress, backups, and recent delivery across all tenants.',
    refresh: 'Refresh',
    loading: 'Checking…',
    failed: 'Health check failed',
    checkedAt: (when) => `Last check ${when}`,
    checks: 'Platform checks',
    database: 'Database',
    ses: 'Amazon SES',
    smtp: 'SMTP relay',
    backup: 'Backups',
    ok: 'OK',
    warn: 'Warn',
    down: 'Down',
    off: 'Off',
    degraded: 'Degraded',
    latency: (ms) => `${ms} ms`,
    region: (name) => `Region ${name}`,
    sesQuota: (sent, max) => `SES 24h ${sent} / ${max}`,
    detailReachable: 'Reachable',
    detailSesOk: 'Credentials accepted',
    detailSesMissing: 'Credentials are not configured',
    detailSesFallback: 'Not configured — SMTP relay is the fallback',
    detailSmtpOff: 'Relay is disabled',
    detailSmtpNoHost: 'Enabled without a host',
    detailNotChecked: 'Not checked',
    detailBackupFresh: 'Last dump succeeded',
    detailBackupStale: 'Last dump is older than the stale threshold',
    detailBackupFailed: 'Last scheduled dump failed',
    detailBackupMissing: 'No dump has been recorded',
    detailBackupSchedulerMissing: 'Backup scheduler is not detected',
    lastDump: (when) => `Last dump ${when}`,
    volume24h: 'Last 24 hours',
    volume7d: 'Last 7 days',
    total: 'Total',
    sent: 'Sent',
    delivered: 'Delivered',
    pending: 'Pending',
    bounced: 'Bounced',
    complained: 'Complained',
    failedStatus: 'Failed',
    inventory: 'Inventory',
    tenants: 'Tenants',
    active: 'Active',
    domains: 'Domains',
    verified: 'Verified',
    pendingDomains: 'Pending',
    failedDomains: 'Failed',
    topTenants: 'Top tenants (7d)',
    emptyTenants: 'No sends in the last 7 days.',
    recentFailures: 'Recent failures',
    emptyFailures: 'No failed, bounced, or complained messages.',
    when: 'When',
    tenant: 'Tenant',
    from: 'From',
    to: 'To',
    subject: 'Subject',
    status: 'Status',
  },
  tabs: {
    domainsTitle: 'Domains',
    apiKeysTitle: 'API Keys',
    logsTitle: 'Email Logs',
    logsLead: 'View and monitor all emails sent through your RelayHorizon tenant.',
  },
  domains: {
    kicker: 'Tenant / domains',
    lead:
      'Sending stays off until MX, SPF, DKIM, and DMARC match the records listed here.',
    add: 'Add domain',
    adding: 'Adding…',
    placeholder: 'mail.example.com',
    empty: 'No domains yet. Add one to see the DNS records receivers require.',
    records: 'DNS records',
    check: 'Check records',
    checking: 'Checking…',
    copy: 'Copy',
    type: 'Type',
    name: 'Name',
    value: 'Value',
    purpose: 'Purpose',
    status: 'Status',
    valid: 'Valid',
    invalid: 'Invalid',
    pending: 'Pending',
    verified: 'Verified',
    failed: 'Failed',
    cannotSend: 'Sending is blocked until every required record is valid.',
    delete: 'Delete',
    confirmDelete: 'Delete this domain?',
    added: 'Added',
    hide: 'Hide records',
    dnsTitle: 'DNS verification',
    sesRecords: 'SES records',
    smtpRecords: 'SMTP records',
    noDomainYet: 'No domain yet',
    emptyTitle: 'No domains yet',
    expectedValue: 'Expected value',
    host: 'Host',
    state: 'State',
    addFailed: 'Failed to add domain',
    verifyFailed: 'Failed to verify domain',
    deleteFailed: 'Failed to delete domain',
    copyFailed: 'Copy failed',
  },
  keys: {
    title: 'API credentials',
    create: 'Create API key',
    createSubmit: 'Create key',
    creating: 'Creating…',
    copyOnce: 'Copy once',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    domain: 'Domain',
    selectDomain: 'Select a domain',
    label: 'Label',
    labelPlaceholder: 'Production',
    cancel: 'Cancel',
    emptyTitle: 'No API keys',
    emptyBody: 'Create your first API key to start sending mail.',
    prefix: 'Key prefix',
    scope: 'Scope',
    lastUsed: 'Last used',
    confirmDelete: 'Are you sure you want to delete this API key? This action cannot be undone.',
    needVerified: 'Add and verify a domain on the Domains page before creating API keys.',
    chooseFields: 'Choose a domain and a label.',
    createFailed: 'Failed to create API key',
    deleteFailed: 'Failed to delete API key',
    delete: 'Delete',
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
  },
  logs: {
    title: 'Message events',
    search: 'Message ID or recipient',
    anyStatus: 'Any status',
    delivered: 'Delivered',
    bounced: 'Bounced',
    sent: 'Sent',
    failed: 'Failed',
    complained: 'Complained',
    apply: 'Apply',
    emptyTitle: 'No matching events',
    emptyBody: 'Adjust filters or send a message through this tenant.',
    subject: 'Subject',
    recipient: 'Recipient',
    status: 'Status',
    domain: 'Domain',
    sentAt: 'Sent',
    previous: 'Previous',
    next: 'Next',
    pageOf: (page, total) => `Page ${page} of ${total}`,
    details: 'Email details',
    from: 'From',
    to: 'To',
    created: 'Created',
    textContent: 'Text content',
    close: 'Close',
    noSubject: '(No subject)',
    loadFailed: 'Failed to load email details',
  },
  portalLogs: {
    searchTitle: 'Delivery search',
    searchLead: 'Search every tenant send. Bodies are omitted from the list.',
    anyTenant: 'Any tenant',
    retainTitle: 'Retention and export',
    retainLead:
      'Purge old rows or strip HTML/text after a number of days. 0 disables that step. Container stdout stays in Dokploy.',
    keepDays: 'Keep rows (days)',
    stripDays: 'Strip bodies after (days)',
    saveRetention: 'Save retention',
    rotateNow: 'Rotate now',
    exportOps: 'Export ops log',
    retentionSaved: 'Retention saved.',
    rotated: (purged, stripped) =>
      `Rotated: ${purged} purged, ${stripped} stripped.`,
    lastRotate: (when, purged, stripped) =>
      `Last rotate ${when}: ${purged} purged, ${stripped} stripped.`,
    failed: 'Could not load platform logs',
  },
  backups: {
    statusTitle: 'Database backups',
    statusLead:
      'Full Postgres dumps. Treat them as secrets. Restore replaces this instance.',
    lastSuccess: 'Last success',
    scheduler: 'Scheduler',
    schedulerMissing: 'Not detected — start the db-backup service',
    lastOffsite: 'Last offsite push',
    stale: 'stale',
    exportNow: 'Export now',
    exported: 'Dump written.',
    scheduleTitle: 'Schedule',
    scheduleEnabled: 'Scheduled dumps',
    interval: 'Interval',
    saveSchedule: 'Save schedule',
    scheduleSaved: 'Schedule saved.',
    on: 'On',
    off: 'Off',
    retentionTitle: 'Dump rotation',
    keepDaily: 'Daily keep',
    keepWeekly: 'Weekly keep',
    keepMonthly: 'Monthly keep',
    autoRotate: 'Auto-rotate',
    saveRetention: 'Save rotation',
    retentionSaved: 'Rotation saved.',
    artifactsTitle: 'Local dumps',
    emptyTitle: 'No dumps yet',
    emptyBody: 'Export now or wait for the scheduled sidecar.',
    artifact: 'File',
    size: 'Size',
    modified: 'Modified',
    download: 'Download',
    push: 'Push',
    delete: 'Delete',
    deleted: 'Dump deleted.',
    pushed: 'Pushed offsite.',
    importTitle: 'Restore',
    importLead: 'Type REPLACE. This wipes the current database.',
    importFile: 'Dump file',
    confirmReplace: 'Confirm',
    importNow: 'Import and replace',
    imported: 'Database replaced. Restart web if pools stall.',
    offsiteTitle: 'S3-compatible offsite',
    offsiteLead: 'Optional remote copy after each export. Empty secrets keep the stored value.',
    offsiteEnabled: 'Offsite upload',
    endpoint: 'Endpoint',
    region: 'Region',
    bucket: 'Bucket',
    prefix: 'Prefix',
    accessKey: 'Access key',
    secretKey: 'Secret key',
    pathStyle: 'Path-style URL',
    saveOffsite: 'Save offsite',
    offsiteSaved: 'Offsite settings saved.',
    testOffsite: 'Test connection',
    testOk: 'Bucket reachable.',
    pushLatest: 'Push latest',
    failed: 'Backup request failed',
  },
};

const de: Dict = {
  loading: 'RelayHorizon wird geladen…',
  brand: 'RelayHorizon',
  brandBy: 'von Nethorizon',
  brandHome: 'RelayHorizon Startseite',
  prefs: {
    language: 'Sprache',
    theme: 'Darstellung',
    dark: 'Dunkel',
    light: 'Hell',
    changeLanguage: 'Sprache ändern',
    toggleTheme: 'Darstellung umschalten',
  },
  landing: {
    login: 'Anmelden',
    getStarted: 'RelayHorizon bereitstellen',
    kicker: 'Option 2 — Operations',
    headline1: 'Ausgehende E-Mail.',
    headline2: 'Innerhalb Ihrer Perimeter.',
    lede:
      'Multi-Mandanten-Infrastruktur mit Resend-kompatiblem HTTPS, SMTP-Eingang und explizitem SES- oder Relay-Ausgang.',
    createTenant: 'Installation konfigurieren',
    openConsole: 'Konsole öffnen',
    edition: 'Infrastruktur sollte lesbar sein, bevor sie magisch wirkt.',
    factsTitle1: 'Drei Fakten.',
    factsTitle2: 'Nichts versteckt.',
    fact1Title: 'Bekannte API',
    fact1Body: 'Resend-kompatible Anfragen',
    fact2Title: 'Klare Mandanten',
    fact2Body: 'Provisionierte Kundengrenzen',
    fact3Title: 'Eigener Ingress',
    fact3Body: 'HTTPS- und SMTP-Listener',
    fact4Title: 'Gewählter Egress',
    fact4Body: 'SES oder Standard-SMTP',
    routeTitle: 'Aktive Route / acme-production',
    routeHttps: 'HTTPS API :443',
    routeTenant: 'acme-labs',
    routeSmtp: 'SMTP :587',
    routeEgress: 'SES eu-central-1',
    nodeIngress: 'INGRESS',
    nodeTenant: 'MANDANT',
    nodeEgress: 'EGRESS',
    signal: 'Alle Systeme betriebsbereit',
    footBrand: 'RelayHorizon. von Nethorizon',
    publicNav: 'Öffentlich',
    sourceCredit: 'Basiert auf FreeResend von EliteCoders.',
  },
  login: {
    kickerStory: 'RelayHorizon-Konsole',
    headline: 'Zurück in den Versandraum.',
    story:
      'Melden Sie sich an, um Upstreams, Domains, API-Schlüssel, Kontingente und Versandverkehr Ihrer Mandanten zu verwalten.',
    meta: 'HTTPS / SES / SMTP / MCP',
    kickerPanel: 'Sicherer Zugang',
    title: 'Anmelden',
    lead: 'Nutzen Sie die Zugangsdaten des Mandanteninhabers.',
    email: 'E-Mail-Adresse',
    password: 'Passwort',
    submit: 'Anmelden',
    submitting: 'Anmeldung…',
    back: 'Zurück',
    failed: 'Anmeldung fehlgeschlagen',
    createAccount: 'Operatorkonto anlegen',
    emailPlaceholder: 'operator@firma.test',
    passwordPlaceholder: 'Mindestens 12 Zeichen',
    prefsAria: 'Anmelde-Einstellungen',
    apiExampleAria: 'API-Beispiel',
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort verbergen',
  },
  register: {
    kickerStory: 'RelayHorizon-Konsole',
    headline: 'Geben Sie dem Versand eine Grenze.',
    story:
      'Legen Sie einen isolierten Mandanten an. Den Upstream wählen Sie später, Schlüssel rotieren ohne Unterbrechung, jede Sendung bleibt nachvollziehbar.',
    meta: 'HTTPS / SES / SMTP / MCP',
    kickerPanel: 'Neue Organisation',
    title: 'Konto initialisieren',
    lead: 'Legen Sie die erste Control-Plane-Identität fest.',
    org: 'Organisationsname',
    operatorName: 'Operatorname',
    slug: 'Mandanten-Slug',
    email: 'Dienstliche E-Mail',
    password: 'Passwort',
    submit: 'Konto anlegen',
    submitting: 'Wird angelegt…',
    back: 'Zurück',
    failed: 'Registrierung fehlgeschlagen',
    useExisting: 'Bestehendes Konto verwenden',
    namePlaceholder: 'Mara Varga',
    emailPlaceholder: 'operator@firma.test',
    passwordPlaceholder: 'Mindestens 12 Zeichen',
    prefsAria: 'Konto-Einstellungen',
  },
  nav: {
    sending: 'Versand',
    domains: 'Domains',
    apiKeys: 'API-Schlüssel',
    logs: 'Protokolle',
    customers: 'Kunden',
    users: 'Benutzer',
    agents: 'Agenten',
    health: 'Status',
    backups: 'Backups',
    settings: 'Konfiguration',
    signOut: 'Abmelden',
    switchTenant: 'Mandant wechseln',
    tenantFallback: 'Mandant',
    tabs: 'Mandanten-Navigation',
    portal: 'Plattform-Portal',
    openMenu: 'Menü öffnen',
    closeMenu: 'Menü schließen',
    menu: 'Menü',
    tenantConsole: 'Mandantenkonsole',
    portalNav: 'Plattform-Portal',
    crumbPrefix: 'NETHORIZON /',
    platformCrumb: 'PLATTFORM',
    backToTenant: (name) => `← ${name} Mandant`,
    backToConsole: '← Mandantenkonsole',
    guide: 'Handbuch',
  },
  changelog: {
    title: 'Versionshinweise',
    lead: 'Änderungen in dieser Installation. Neueste zuerst.',
    close: 'Schließen',
    current: 'Diese Installation',
    added: 'Neu',
    changed: 'Geändert',
    fixed: 'Behoben',
    openNotes: 'Versionshinweise öffnen',
  },
  sending: {
    kicker: 'Mandant / Versand',
    title: 'Versand',
    lead:
      'Wählen Sie, wie Anwendungen Post an RelayHorizon übergeben und wie RelayHorizon zustellt.',
    quota: 'Monatskontingent',
    used: (n) => `${n} in diesem Monat genutzt`,
    loading: 'Laden…',
    volume: '30-Tage-Volumen',
    volumeHint: 'Protokollierte Sendungen dieses Mandanten',
    upstream: 'Zustell-Upstream',
    upstreamAria: 'Zustell-Upstream',
    sesHint: 'HTTPS zu Amazon SES',
    smtpHint: 'Host + Zugangsdaten',
    host: 'Host',
    port: 'Port',
    username: 'Benutzername',
    password: 'Passwort',
    tls: 'TLS verlangen',
    save: 'Upstream speichern',
    saved: 'Versandweg gespeichert.',
    saveFailed: 'Speichern fehlgeschlagen',
    firstRequest: 'HTTPS-Anfrage',
    firstRequestHint: 'Der HTTPS-Endpunkt folgt der Resend-Anfrageform.',
    ingress: 'Eingang',
    ingressAria: 'Eingang',
    httpsHint: 'Resend-kompatibel POST /api/emails',
    smtpIngressHint:
      'SMTP-Submission auf 587 (auch 2525). Benutzername relayhorizon, Passwort ist ein API-Schlüssel.',
    bothHint: 'HTTPS und SMTP akzeptieren',
    smtpSubmit: 'SMTP-Submission',
    smtpSubmitHint: 'Benutzername ist relayhorizon. Passwort ist ein API-Schlüssel.',
    smtpUser: 'Benutzername',
    smtpPassHint: 'Passwort: Ihr API-Schlüssel (frs_…)',
    ingressPolicy: 'Eingangsrichtlinie',
    egressConnector: 'Ausgangsanschluss',
    https: 'HTTPS',
    smtp: 'SMTP',
    both: 'Beides',
    publicApiUrl: 'Öffentliche API-URL',
    smtpHost: 'SMTP-Host',
    smtpPort: 'SMTP-Port',
    tlsMode: 'TLS-Modus',
    tlsRequired: 'Erforderlich',
    tlsOpportunistic: 'Opportunistisch',
    amazonSes: 'Amazon SES',
    smtpRelay: 'SMTP-Relay',
    secret: 'Geheimnis',
    awsRegion: 'AWS-Region',
    configSet: 'Configuration set',
    accessKey: 'Access-Key-ID',
    secretKey: 'Geheimer Access Key',
    saveRoute: 'Route speichern',
    platformRelayHint:
      'Host leer lassen, um das Plattform-SMTP-Relay zu nutzen.',
  },
  customers: {
    kicker: 'Portalverwaltung',
    title: 'Kunden',
    lead:
      'Isolierte Organisationen anlegen, Eigentum festlegen und den Ausgangsweg zuweisen.',
    org: 'Organisation',
    ownerEmail: 'Inhaber-E-Mail',
    tempPassword: 'Temporäres Passwort',
    domain: 'Domain',
    ingress: 'Eingang',
    egress: 'Ausgang',
    provision: 'Mandanten provisionieren',
    registry: 'Mandantenverzeichnis',
    name: 'Name',
    slug: 'Slug',
    status: 'Status',
    created: (slug) => `${slug} angelegt. Geheimnisse jetzt speichern:`,
    apiKey: 'API-Schlüssel',
    mcpToken: 'MCP-Token',
    failed: 'Anlegen fehlgeschlagen',
    open: 'Mandant öffnen',
    opening: 'Wird geöffnet…',
    domainOptional: 'Domain (optional)',
    provisionAction: 'Provisionieren',
    organization: 'Organisation',
    route: 'Route',
    state: 'Status',
    bothIngress: 'HTTPS + SMTP',
    passwordPlaceholder: 'Anfangs-Zugangsdaten',
  },
  users: {
    addTitle: 'Plattformbenutzer hinzufügen',
    addLead:
      'Neuen Operator anlegen oder einem bestehenden Konto Portalzugang geben.',
    name: 'Name',
    namePlaceholder: 'Ada Lovelace',
    email: 'E-Mail',
    password: 'Passwort',
    passwordPlaceholder: 'Pflicht für ein neues Konto, mindestens 8 Zeichen',
    addAction: 'Benutzer hinzufügen',
    adding: 'Wird hinzugefügt…',
    created: 'Plattformbenutzer angelegt. Anmeldung im Portal ist möglich.',
    promoted: 'Bestehendes Konto hat jetzt Portalzugang.',
    registry: 'Plattformbenutzer',
    empty: 'Noch keine Plattformadministratoren.',
    added: 'Hinzugefügt',
    you: 'Sie',
    setPassword: 'Passwort',
    newPassword: 'Neues Passwort',
    savePassword: 'Speichern',
    passwordUpdated: 'Passwort aktualisiert.',
    cancel: 'Abbrechen',
    revoke: 'Entziehen',
    revoking: 'Wird entzogen…',
    revoked: 'Plattformzugang entzogen.',
    failed: 'Benutzeränderung fehlgeschlagen',
  },
  agents: {
    addTitle: 'Agent hinzufügen',
    platformLead:
      'Ein Plattform-Agent kann dieselben Portal-APIs wie ein Administrator nutzen. MCP-Client auf den Endpunkt mit diesem Token richten.',
    tenantLead:
      'Ein Mandanten-Agent sieht nur diese Organisation. MCP-Client auf den Endpunkt mit diesem Token richten.',
    endpoint: 'MCP-Endpunkt',
    name: 'Name',
    namePlaceholder: 'Ops-Copilot',
    addAction: 'Agent erstellen',
    adding: 'Wird erstellt…',
    registry: 'Agenten',
    empty: 'Noch keine Agenten.',
    prefix: 'Präfix',
    lastUsed: 'Zuletzt genutzt',
    added: 'Hinzugefügt',
    copyOnce: 'Token jetzt kopieren. Er wird nicht erneut angezeigt.',
    copy: 'Kopieren',
    copied: 'Kopiert',
    copyFailed: 'Token konnte nicht kopiert werden',
    revoke: 'Entziehen',
    revoking: 'Wird entzogen…',
    confirmRevoke:
      'Diesen Agent-Token entziehen? Verbundene Clients funktionieren nicht mehr.',
    failed: 'Agentänderung fehlgeschlagen',
  },
  portal: {
    kicker: 'Nethorizon / Portal',
    title: 'Portal',
    lead: 'Kunden hier anlegen. Einen Mandanten öffnen, um seine Versandkonsole zu nutzen.',
  },
  settings: {
    title: 'Konfiguration',
    sesTitle: 'Amazon SES',
    sesLead:
      'Installations-Zugangsdaten für SES-Ausgang und Domain-Verifizierung.',
    smtpTitle: 'SMTP-Relay',
    smtpLead:
      'Gemeinsames Ausgangs-Relay für Mandanten mit SMTP ohne eigenen Upstream.',
    smtpEnabled: 'Aktiv',
    smtpDisabled: 'Inaktiv',
    ingressTitle: 'SMTP-Submission',
    ingressLead:
      'Ports des Eingangs-Listeners. 587 nutzt STARTTLS mit Zertifikat; 465 ist implizites TLS. 2525 eignet sich lokal. Speichern, SMTP-Prozess weiterlaufen lassen — er lädt neu.',
    listenPorts: 'Hörende Ports',
    port2525: '2525',
    port587: '587',
    port465: '465',
    ingressTls: 'Eingangs-TLS',
    tlsOff: 'Aus',
    tlsStarttls: 'STARTTLS',
    tlsRequired: 'Pflicht',
    tlsCert: 'Zertifikat (PEM)',
    tlsKey: 'Privater Schlüssel (PEM)',
    tlsHint:
      'Let’s Encrypt stellt das Zertifikat aus und erneuert es. Auf Manuell wechseln, um PEMs einzufügen.',
    tlsSource: 'Zertifikat',
    tlsLetsEncrypt: 'Let’s Encrypt',
    tlsManual: 'Manuell',
    tlsDomain: 'Hostname',
    tlsLeHint:
      'Hinter Traefik oder Dokploy DNS-TXT bevorzugen. HTTP-01 nur, wenn der Hostname Port 80 inklusive /.well-known/acme-challenge hier erreicht.',
    tlsChallenge: 'Validierung',
    tlsChallengeHttp: 'HTTP-01',
    tlsChallengeDo: 'DigitalOcean-DNS',
    tlsChallengeIsp: 'ISPConfig',
    tlsChallengeDns: 'DNS-TXT',
    tlsHttpHint:
      'Let’s Encrypt muss http://hostname/.well-known/acme-challenge auf dieser App erreichen. Traefik fängt den Pfad oft ab — auf Dokploy DNS-TXT nutzen.',
    tlsDoHint:
      'Legt _acme-challenge automatisch an, wenn die Zone in DigitalOcean liegt (DO_API_TOKEN). Erneuert sich selbst.',
    tlsIspHint:
      'Legt den TXT-Record über die ISPConfig Remote-JSON-API an. Der Remote-User braucht DNS-Zone, DNS-TXT und Client-Rechte. Erneuert sich selbst.',
    tlsIspUrl: 'ISPConfig-API-URL',
    tlsIspUser: 'Remote-Benutzer',
    tlsIspPassword: 'Remote-Passwort',
    tlsIspTls: 'Panel-TLS',
    tlsIspSecure: 'Prüfen',
    tlsIspInsecure: 'Unsicher erlauben',
    tlsDnsHint:
      'TXT-Record beim DNS-Anbieter anlegen, kurz warten, dann fortfahren. Erneuerung braucht denselben Schritt.',
    tlsManualHint:
      'Zertifikat und Schlüssel einfügen oder SMTP_TLS_CERT_PATH und SMTP_TLS_KEY_PATH setzen.',
    tlsStatusIdle: 'Noch kein Zertifikat. Öffentlichen Hostnamen speichern, um eines anzufordern.',
    tlsStatusPending: 'Zertifikat wird bei Let’s Encrypt angefordert…',
    tlsStatusWaitingDns: 'TXT-Record unten anlegen, dann fortfahren.',
    tlsStatusIssued: 'Zertifikat ausgestellt',
    tlsStatusError: 'Zertifikatsanforderung fehlgeschlagen',
    tlsExpiresOn: (when) => `Läuft ab ${when}`,
    tlsRenewsOn: (when) => `Nächste Erneuerung ${when}`,
    tlsIssueNow: 'Jetzt ausstellen / erneuern',
    tlsIssuing: 'Anforderung…',
    tlsNoCertYet: 'Noch kein Zertifikat gespeichert.',
    tlsDnsRecordName: 'TXT-Name',
    tlsDnsRecordValue: 'TXT-Wert',
    tlsDnsContinue: 'Record ist angelegt',
    tlsDnsContinuing: 'DNS wird geprüft…',
    alertTitle: 'Überwachung und Alarmierung',
    alertLead:
      'Betriebshinweise, inklusive Warteliste und Zustellalarme, gehen an diese Adresse.',
    alertEmail: 'Alarm-E-Mail',
    alertFrom: 'Absenderadresse',
    save: 'Konfiguration speichern',
    saved: 'Plattformkonfiguration gespeichert.',
    saveFailed: 'Speichern fehlgeschlagen',
    secretSet: 'Gespeichert — neuen Wert eingeben zum Rotieren',
    testTitle: 'Testversand',
    testLead:
      'Zuerst Konfiguration speichern. SES oder SMTP wählen. Bei SES muss der Absender eine verifizierte Identität sein.',
    testVia: 'Ausgang',
    testFrom: 'Von',
    testTo: 'An',
    testSend: 'Test-E-Mail senden',
    testSending: 'Senden…',
    testSent: (via, id) => `Gesendet über ${via}. Nachrichten-ID ${id}`,
    testFailed: 'Testversand fehlgeschlagen',
    testSmtpDisabled: 'SMTP-Relay aktivieren, um diesen Weg zu testen',
  },
  health: {
    title: 'Status',
    lead: 'Datenbank, Ausgang, Backups und letzte Zustellung über alle Mandanten.',
    refresh: 'Aktualisieren',
    loading: 'Prüfung…',
    failed: 'Statusprüfung fehlgeschlagen',
    checkedAt: (when) => `Letzte Prüfung ${when}`,
    checks: 'Plattformprüfungen',
    database: 'Datenbank',
    ses: 'Amazon SES',
    smtp: 'SMTP-Relay',
    backup: 'Backups',
    ok: 'OK',
    warn: 'Warnung',
    down: 'Aus',
    off: 'Inaktiv',
    degraded: 'Eingeschränkt',
    latency: (ms) => `${ms} ms`,
    region: (name) => `Region ${name}`,
    sesQuota: (sent, max) => `SES 24h ${sent} / ${max}`,
    detailReachable: 'Erreichbar',
    detailSesOk: 'Zugangsdaten akzeptiert',
    detailSesMissing: 'Zugangsdaten sind nicht konfiguriert',
    detailSesFallback: 'Nicht konfiguriert — SMTP-Relay ist der Fallback',
    detailSmtpOff: 'Relay ist deaktiviert',
    detailSmtpNoHost: 'Aktiv, aber ohne Host',
    detailNotChecked: 'Nicht geprüft',
    detailBackupFresh: 'Letztes Dump erfolgreich',
    detailBackupStale: 'Letztes Dump ist älter als der Schwellenwert',
    detailBackupFailed: 'Letztes geplantes Dump fehlgeschlagen',
    detailBackupMissing: 'Kein Dump vorhanden',
    detailBackupSchedulerMissing: 'Backup-Planer nicht erkannt',
    lastDump: (when) => `Letztes Dump ${when}`,
    volume24h: 'Letzte 24 Stunden',
    volume7d: 'Letzte 7 Tage',
    total: 'Gesamt',
    sent: 'Gesendet',
    delivered: 'Zugestellt',
    pending: 'Ausstehend',
    bounced: 'Unzustellbar',
    complained: 'Beschwerde',
    failedStatus: 'Fehlgeschlagen',
    inventory: 'Bestand',
    tenants: 'Mandanten',
    active: 'Aktiv',
    domains: 'Domains',
    verified: 'Verifiziert',
    pendingDomains: 'Ausstehend',
    failedDomains: 'Fehlgeschlagen',
    topTenants: 'Top-Mandanten (7T)',
    emptyTenants: 'Keine Sendungen in den letzten 7 Tagen.',
    recentFailures: 'Letzte Fehler',
    emptyFailures: 'Keine fehlgeschlagenen, unzustellbaren oder Beschwerde-Nachrichten.',
    when: 'Zeit',
    tenant: 'Mandant',
    from: 'Von',
    to: 'An',
    subject: 'Betreff',
    status: 'Status',
  },
  tabs: {
    domainsTitle: 'Domains',
    apiKeysTitle: 'API-Schlüssel',
    logsTitle: 'E-Mail-Protokolle',
    logsLead: 'Alle über Ihren RelayHorizon-Mandanten gesendeten E-Mails einsehen.',
  },
  domains: {
    kicker: 'Mandant / Domains',
    lead:
      'Versand bleibt aus, bis MX, SPF, DKIM und DMARC den hier gelisteten Records entsprechen.',
    add: 'Domain hinzufügen',
    adding: 'Wird hinzugefügt…',
    placeholder: 'mail.example.com',
    empty: 'Noch keine Domains. Fügen Sie eine hinzu, um die DNS-Records zu sehen.',
    records: 'DNS-Records',
    check: 'Records prüfen',
    checking: 'Prüfung…',
    copy: 'Kopieren',
    type: 'Typ',
    name: 'Name',
    value: 'Wert',
    purpose: 'Zweck',
    status: 'Status',
    valid: 'Gültig',
    invalid: 'Ungültig',
    pending: 'Ausstehend',
    verified: 'Verifiziert',
    failed: 'Fehlgeschlagen',
    cannotSend: 'Versand ist gesperrt, bis jeder erforderliche Record gültig ist.',
    delete: 'Löschen',
    confirmDelete: 'Diese Domain löschen?',
    added: 'Hinzugefügt',
    hide: 'Records ausblenden',
    dnsTitle: 'DNS-Verifizierung',
    sesRecords: 'SES-Records',
    smtpRecords: 'SMTP-Records',
    noDomainYet: 'Noch keine Domain',
    emptyTitle: 'Noch keine Domains',
    expectedValue: 'Erwarteter Wert',
    host: 'Host',
    state: 'Status',
    addFailed: 'Domain konnte nicht hinzugefügt werden',
    verifyFailed: 'Domain konnte nicht geprüft werden',
    deleteFailed: 'Domain konnte nicht gelöscht werden',
    copyFailed: 'Kopieren fehlgeschlagen',
  },
  keys: {
    title: 'API-Zugangsdaten',
    create: 'API-Schlüssel erstellen',
    createSubmit: 'Schlüssel erstellen',
    creating: 'Wird erstellt…',
    copyOnce: 'Nur einmal kopieren',
    copy: 'Kopieren',
    copied: 'Kopiert',
    copyFailed: 'Kopieren fehlgeschlagen',
    domain: 'Domain',
    selectDomain: 'Domain wählen',
    label: 'Bezeichnung',
    labelPlaceholder: 'Produktion',
    cancel: 'Abbrechen',
    emptyTitle: 'Keine API-Schlüssel',
    emptyBody: 'Erstellen Sie den ersten API-Schlüssel, um Mail zu senden.',
    prefix: 'Schlüsselpräfix',
    scope: 'Geltungsbereich',
    lastUsed: 'Zuletzt genutzt',
    confirmDelete: 'Diesen API-Schlüssel wirklich löschen? Das kann nicht rückgängig gemacht werden.',
    needVerified: 'Fügen Sie auf der Domains-Seite eine verifizierte Domain hinzu, bevor Sie API-Schlüssel erstellen.',
    chooseFields: 'Wählen Sie eine Domain und eine Bezeichnung.',
    createFailed: 'API-Schlüssel konnte nicht erstellt werden',
    deleteFailed: 'API-Schlüssel konnte nicht gelöscht werden',
    delete: 'Löschen',
    minutesAgo: (n) => `vor ${n} Min.`,
    hoursAgo: (n) => `vor ${n} Std.`,
  },
  logs: {
    title: 'Nachrichtenereignisse',
    search: 'Nachrichten-ID oder Empfänger',
    anyStatus: 'Jeder Status',
    delivered: 'Zugestellt',
    bounced: 'Abgewiesen',
    sent: 'Gesendet',
    failed: 'Fehlgeschlagen',
    complained: 'Beschwerde',
    apply: 'Anwenden',
    emptyTitle: 'Keine passenden Ereignisse',
    emptyBody: 'Filter anpassen oder eine Nachricht über diesen Mandanten senden.',
    subject: 'Betreff',
    recipient: 'Empfänger',
    status: 'Status',
    domain: 'Domain',
    sentAt: 'Gesendet',
    previous: 'Zurück',
    next: 'Weiter',
    pageOf: (page, total) => `Seite ${page} von ${total}`,
    details: 'E-Mail-Details',
    from: 'Von',
    to: 'An',
    created: 'Erstellt',
    textContent: 'Textinhalt',
    close: 'Schließen',
    noSubject: '(Kein Betreff)',
    loadFailed: 'E-Mail-Details konnten nicht geladen werden',
  },
  portalLogs: {
    searchTitle: 'Zustellsuche',
    searchLead: 'Suche über alle Mandanten. Textkörper fehlen in der Liste.',
    anyTenant: 'Alle Mandanten',
    retainTitle: 'Aufbewahrung und Export',
    retainLead:
      'Alte Zeilen löschen oder HTML/Text nach Tagen entfernen. 0 deaktiviert den Schritt. Container-Logs bleiben in Dokploy.',
    keepDays: 'Zeilen behalten (Tage)',
    stripDays: 'Körper entfernen nach (Tagen)',
    saveRetention: 'Aufbewahrung speichern',
    rotateNow: 'Jetzt rotieren',
    exportOps: 'Ops-Log exportieren',
    retentionSaved: 'Aufbewahrung gespeichert.',
    rotated: (purged, stripped) =>
      `Rotiert: ${purged} gelöscht, ${stripped} bereinigt.`,
    lastRotate: (when, purged, stripped) =>
      `Letzte Rotation ${when}: ${purged} gelöscht, ${stripped} bereinigt.`,
    failed: 'Plattform-Logs konnten nicht geladen werden',
  },
  backups: {
    statusTitle: 'Datenbank-Backups',
    statusLead:
      'Vollständige Postgres-Dumps. Als Geheimnisse behandeln. Restore ersetzt diese Instanz.',
    lastSuccess: 'Letzter Erfolg',
    scheduler: 'Planer',
    schedulerMissing: 'Nicht erkannt — db-backup starten',
    lastOffsite: 'Letzter Offsite-Push',
    stale: 'veraltet',
    exportNow: 'Jetzt exportieren',
    exported: 'Dump geschrieben.',
    scheduleTitle: 'Zeitplan',
    scheduleEnabled: 'Geplante Dumps',
    interval: 'Intervall',
    saveSchedule: 'Zeitplan speichern',
    scheduleSaved: 'Zeitplan gespeichert.',
    on: 'An',
    off: 'Aus',
    retentionTitle: 'Dump-Rotation',
    keepDaily: 'Täglich behalten',
    keepWeekly: 'Wöchentlich behalten',
    keepMonthly: 'Monatlich behalten',
    autoRotate: 'Automatisch rotieren',
    saveRetention: 'Rotation speichern',
    retentionSaved: 'Rotation gespeichert.',
    artifactsTitle: 'Lokale Dumps',
    emptyTitle: 'Noch keine Dumps',
    emptyBody: 'Jetzt exportieren oder auf den Sidecar warten.',
    artifact: 'Datei',
    size: 'Größe',
    modified: 'Geändert',
    download: 'Download',
    push: 'Push',
    delete: 'Löschen',
    deleted: 'Dump gelöscht.',
    pushed: 'Offsite übertragen.',
    importTitle: 'Wiederherstellen',
    importLead: 'REPLACE eingeben. Das aktuelle Datenbank wird geleert.',
    importFile: 'Dump-Datei',
    confirmReplace: 'Bestätigen',
    importNow: 'Importieren und ersetzen',
    imported: 'Datenbank ersetzt. Web neu starten, falls Pools hängen.',
    offsiteTitle: 'S3-kompatibles Offsite',
    offsiteLead: 'Optionale Fernkopie nach jedem Export. Leere Geheimnisse bleiben gespeichert.',
    offsiteEnabled: 'Offsite-Upload',
    endpoint: 'Endpunkt',
    region: 'Region',
    bucket: 'Bucket',
    prefix: 'Präfix',
    accessKey: 'Access Key',
    secretKey: 'Secret Key',
    pathStyle: 'Path-Style-URL',
    saveOffsite: 'Offsite speichern',
    offsiteSaved: 'Offsite gespeichert.',
    testOffsite: 'Verbindung testen',
    testOk: 'Bucket erreichbar.',
    pushLatest: 'Letzten pushen',
    failed: 'Backup-Anfrage fehlgeschlagen',
  },
};

const hu: Dict = {
  loading: 'RelayHorizon betöltése…',
  brand: 'RelayHorizon',
  brandBy: 'a Nethorizontól',
  brandHome: 'RelayHorizon kezdőlap',
  prefs: {
    language: 'Nyelv',
    theme: 'Téma',
    dark: 'Sötét',
    light: 'Világos',
    changeLanguage: 'Nyelv váltása',
    toggleTheme: 'Téma váltása',
  },
  landing: {
    login: 'Belépés',
    getStarted: 'RelayHorizon telepítése',
    kicker: 'Option 2 — Operations',
    headline1: 'Kimenő e-mail.',
    headline2: 'A saját periméteren belül.',
    lede:
      'A RelayHorizon a Nethorizon kimenő e-mail vezérlősíkja: Resend-kompatibilis kézbesítés, bérlőnkénti elszigetelés, választható kimenő út.',
    createTenant: 'Bérlő létrehozása',
    openConsole: 'Konzol megnyitása',
    edition: 'Az infrastruktúra legyen olvasható, mielőtt varázslatosnak tűnik.',
    factsTitle1: 'Három tény.',
    factsTitle2: 'Semmi rejtve.',
    fact1Title: 'Ismert API',
    fact1Body: 'Resend-kompatibilis kérések',
    fact2Title: 'Egyértelmű bérlők',
    fact2Body: 'Provisionált ügyfélhatárok',
    fact3Title: 'Saját bejövő út',
    fact3Body: 'HTTPS- és SMTP-figyelők',
    fact4Title: 'Választott kimenet',
    fact4Body: 'SES vagy szabványos SMTP',
    routeTitle: 'Aktív útvonal / acme-production',
    routeHttps: 'HTTPS API :443',
    routeTenant: 'acme-labs',
    routeSmtp: 'SMTP :587',
    routeEgress: 'SES eu-central-1',
    nodeIngress: 'BEJÖVŐ',
    nodeTenant: 'BÉRLŐ',
    nodeEgress: 'KIMENŐ',
    signal: 'Minden rendszer működik',
    footBrand: 'RelayHorizon. a Nethorizontól',
    publicNav: 'Nyilvános',
    sourceCredit: 'A FreeResend (EliteCoders) kódbázisán.',
  },
  login: {
    kickerStory: 'RelayHorizon konzol',
    headline: 'Vissza a küldőszobába.',
    story:
      'Jelentkezzen be a kimenő utak, domainek, API-kulcsok, kvóták és forgalom kezeléséhez.',
    meta: 'HTTPS / SES / SMTP / MCP',
    kickerPanel: 'Biztonságos belépés',
    title: 'Belépés',
    lead: 'Használja a bérlőtulajdonos adatait.',
    email: 'E-mail-cím',
    password: 'Jelszó',
    submit: 'Belépés',
    submitting: 'Belépés…',
    back: 'Vissza',
    failed: 'Sikertelen belépés',
    createAccount: 'Operátori fiók létrehozása',
    emailPlaceholder: 'operator@ceg.test',
    passwordPlaceholder: 'Legalább 12 karakter',
    prefsAria: 'Belépési beállítások',
    apiExampleAria: 'API-példa',
    showPassword: 'Jelszó megjelenítése',
    hidePassword: 'Jelszó elrejtése',
  },
  register: {
    kickerStory: 'RelayHorizon konzol',
    headline: 'Adjon határt a kimenő rendszernek.',
    story:
      'Hozzon létre egy elszigetelt bérlőt. A kimenő utat később választja, a kulcsokat megszakítás nélkül forgatja, minden küldés nyomon követhető marad.',
    meta: 'HTTPS / SES / SMTP / MCP',
    kickerPanel: 'Új szervezet',
    title: 'Fiók inicializálása',
    lead: 'Állítsa be az első control-plane identitást.',
    org: 'Szervezet neve',
    operatorName: 'Operátor neve',
    slug: 'Bérlő-slug',
    email: 'Munkahelyi e-mail',
    password: 'Jelszó',
    submit: 'Fiók létrehozása',
    submitting: 'Létrehozás…',
    back: 'Vissza',
    failed: 'Sikertelen regisztráció',
    useExisting: 'Meglévő fiók használata',
    namePlaceholder: 'Mara Varga',
    emailPlaceholder: 'operator@ceg.test',
    passwordPlaceholder: 'Legalább 12 karakter',
    prefsAria: 'Fiókbeállítások',
  },
  nav: {
    sending: 'Küldés',
    domains: 'Domainek',
    apiKeys: 'API-kulcsok',
    logs: 'Naplók',
    customers: 'Ügyfelek',
    users: 'Felhasználók',
    agents: 'Ügynökök',
    health: 'Állapot',
    backups: 'Mentések',
    settings: 'Konfiguráció',
    signOut: 'Kilépés',
    switchTenant: 'Bérlő váltása',
    tenantFallback: 'Bérlő',
    tabs: 'Bérlő navigáció',
    portal: 'Platform portál',
    openMenu: 'Menü megnyitása',
    closeMenu: 'Menü bezárása',
    menu: 'Menü',
    tenantConsole: 'Bérlőkonzol',
    portalNav: 'Platform portál',
    crumbPrefix: 'NETHORIZON /',
    platformCrumb: 'PLATFORM',
    backToTenant: (name) => `← ${name} bérlő`,
    backToConsole: '← Bérlőkonzol',
    guide: 'Útmutató',
  },
  changelog: {
    title: 'Kiadási jegyzetek',
    lead: 'A telepítés változásai. A legújabb elöl.',
    close: 'Bezárás',
    current: 'Ez a telepítés',
    added: 'Új',
    changed: 'Változott',
    fixed: 'Javítva',
    openNotes: 'Kiadási jegyzetek megnyitása',
  },
  sending: {
    kicker: 'Bérlő / küldés',
    title: 'Küldés',
    lead:
      'Válassza ki, hogyan adják be az alkalmazások a levelet, majd hogyan kézbesíti a RelayHorizon.',
    quota: 'Havi kvóta',
    used: (n) => `${n} felhasználva ebben a hónapban`,
    loading: 'Betöltés…',
    volume: '30 napos forgalom',
    volumeHint: 'A bérlő naplózott küldései',
    upstream: 'Kézbesítési upstream',
    upstreamAria: 'Kézbesítési upstream',
    sesHint: 'HTTPS az Amazon SES felé',
    smtpHint: 'Gép + hitelesítés',
    host: 'Gép',
    port: 'Port',
    username: 'Felhasználónév',
    password: 'Jelszó',
    tls: 'TLS kötelező',
    save: 'Upstream mentése',
    saved: 'Küldési útvonal mentve.',
    saveFailed: 'Mentés sikertelen',
    firstRequest: 'HTTPS kérés',
    firstRequestHint: 'A HTTPS végpont a Resend kérésformáját követi.',
    ingress: 'Bejövő út',
    ingressAria: 'Bejövő út',
    httpsHint: 'Resend-kompatibilis POST /api/emails',
    smtpIngressHint:
      'SMTP beküldés a 587-es porton (2525 is). Felhasználónév: relayhorizon, jelszó: API-kulcs.',
    bothHint: 'HTTPS és SMTP is elfogadott',
    smtpSubmit: 'SMTP beküldés',
    smtpSubmitHint: 'A felhasználónév relayhorizon. A jelszó egy API-kulcs.',
    smtpUser: 'Felhasználónév',
    smtpPassHint: 'Jelszó: az API-kulcs (frs_…)',
    ingressPolicy: 'Bejövő szabály',
    egressConnector: 'Kimenő csatlakozó',
    https: 'HTTPS',
    smtp: 'SMTP',
    both: 'Mindkettő',
    publicApiUrl: 'Nyilvános API-URL',
    smtpHost: 'SMTP-gép',
    smtpPort: 'SMTP-port',
    tlsMode: 'TLS-mód',
    tlsRequired: 'Kötelező',
    tlsOpportunistic: 'Opportunista',
    amazonSes: 'Amazon SES',
    smtpRelay: 'SMTP-relé',
    secret: 'Titok',
    awsRegion: 'AWS-régió',
    configSet: 'Configuration set',
    accessKey: 'Access key ID',
    secretKey: 'Secret access key',
    saveRoute: 'Útvonal mentése',
    platformRelayHint:
      'Hagyja üresen a gépet a platform SMTP-relé használatához.',
  },
  customers: {
    kicker: 'Portáladminisztráció',
    title: 'Ügyfelek',
    lead:
      'Elszigetelt szervezetek létrehozása, tulajdonos hozzárendelése és kimenő út beállítása.',
    org: 'Szervezet',
    ownerEmail: 'Tulajdonos e-mail',
    tempPassword: 'Átmeneti jelszó',
    domain: 'Domain',
    ingress: 'Bejövő',
    egress: 'Kimenet',
    provision: 'Bérlő provisionálása',
    registry: 'Bérlőnyilvántartás',
    name: 'Név',
    slug: 'Slug',
    status: 'Állapot',
    created: (slug) => `${slug} létrejött. A titkokat most tárolja:`,
    apiKey: 'API-kulcs',
    mcpToken: 'MCP-token',
    failed: 'Létrehozás sikertelen',
    open: 'Bérlő megnyitása',
    opening: 'Megnyitás…',
    domainOptional: 'Domain (opcionális)',
    provisionAction: 'Provisionálás',
    organization: 'Szervezet',
    route: 'Útvonal',
    state: 'Állapot',
    bothIngress: 'HTTPS + SMTP',
    passwordPlaceholder: 'Kezdő jelszó',
  },
  users: {
    addTitle: 'Platformfelhasználó hozzáadása',
    addLead:
      'Új operátor létrehozása, vagy portálhozzáférés meglévő fióknak.',
    name: 'Név',
    namePlaceholder: 'Ada Lovelace',
    email: 'E-mail',
    password: 'Jelszó',
    passwordPlaceholder: 'Új fióknál kötelező, legalább 8 karakter',
    addAction: 'Felhasználó hozzáadása',
    adding: 'Hozzáadás…',
    created: 'Platformfelhasználó létrejött. Bejelentkezhet a portálra.',
    promoted: 'A meglévő fiók megkapta a portálhozzáférést.',
    registry: 'Platformfelhasználók',
    empty: 'Még nincs platformadminisztrátor.',
    added: 'Hozzáadva',
    you: 'ön',
    setPassword: 'Jelszó',
    newPassword: 'Új jelszó',
    savePassword: 'Mentés',
    passwordUpdated: 'A jelszó frissült.',
    cancel: 'Mégse',
    revoke: 'Visszavonás',
    revoking: 'Visszavonás…',
    revoked: 'A platformhozzáférés visszavonva.',
    failed: 'A felhasználó frissítése sikertelen',
  },
  agents: {
    addTitle: 'Ügynök hozzáadása',
    platformLead:
      'A platformügynök ugyanazokat a portál-API-kat használhatja, mint egy adminisztrátor. MCP-klienst erre a végpontra irányítson ezzel a tokennel.',
    tenantLead:
      'A bérlői ügynök csak ezt a szervezetet látja. MCP-klienst erre a végpontra irányítson ezzel a tokennel.',
    endpoint: 'MCP-végpont',
    name: 'Név',
    namePlaceholder: 'Ops copilot',
    addAction: 'Ügynök létrehozása',
    adding: 'Létrehozás…',
    registry: 'Ügynökök',
    empty: 'Még nincs ügynök.',
    prefix: 'Előtag',
    lastUsed: 'Utolsó használat',
    added: 'Hozzáadva',
    copyOnce: 'Másolja a tokent most. Többé nem jelenik meg.',
    copy: 'Másolás',
    copied: 'Másolva',
    copyFailed: 'A token másolása sikertelen',
    revoke: 'Visszavonás',
    revoking: 'Visszavonás…',
    confirmRevoke:
      'Visszavonja ezt az ügynöktokent? A kapcsolódó kliensek leállnak.',
    failed: 'Az ügynök frissítése sikertelen',
  },
  portal: {
    kicker: 'Nethorizon / portál',
    title: 'Portál',
    lead: 'Itt hozza létre az ügyfeleket. Egy bérlő megnyitásával annak küldőkonzolját használja.',
  },
  settings: {
    title: 'Konfiguráció',
    sesTitle: 'Amazon SES',
    sesLead:
      'Telepítési hitelesítő adatok a bérlői SES-kimenethez és a domain-ellenőrzéshez.',
    smtpTitle: 'SMTP-relé',
    smtpLead:
      'Közös kimenő relé azoknak a bérlőknek, akik SMTP-t választanak saját upstream nélkül.',
    smtpEnabled: 'Bekapcsolva',
    smtpDisabled: 'Kikapcsolva',
    ingressTitle: 'SMTP-beküldés',
    ingressLead:
      'A bemeneti listener portjai. 587 STARTTLS-t használ tanúsítvánnyal; 465 implicit TLS. A 2525 helyi tesztre jó. Mentés után a SMTP-folyamat újratölti.',
    listenPorts: 'Figyelt portok',
    port2525: '2525',
    port587: '587',
    port465: '465',
    ingressTls: 'Bejövő TLS',
    tlsOff: 'Ki',
    tlsStarttls: 'STARTTLS',
    tlsRequired: 'Kötelező',
    tlsCert: 'Tanúsítvány (PEM)',
    tlsKey: 'Privát kulcs (PEM)',
    tlsHint:
      'A Let’s Encrypt kiállítja és megújítja a tanúsítványt. Kézi módhoz váltson, ha PEM-et illeszt be.',
    tlsSource: 'Tanúsítvány',
    tlsLetsEncrypt: 'Let’s Encrypt',
    tlsManual: 'Kézi',
    tlsDomain: 'Gépnév',
    tlsLeHint:
      'Traefik vagy Dokploy mögött a DNS TXT a biztos. HTTP-01 csak akkor, ha a gépnév 80-as porton ide éri el a /.well-known/acme-challenge útvonalat.',
    tlsChallenge: 'Ellenőrzés',
    tlsChallengeHttp: 'HTTP-01',
    tlsChallengeDo: 'DigitalOcean DNS',
    tlsChallengeIsp: 'ISPConfig',
    tlsChallengeDns: 'DNS TXT',
    tlsHttpHint:
      'A Let’s Encryptnek el kell érnie a http://gépnév/.well-known/acme-challenge címet. A Traefik gyakran elnyeli ezt — Dokployon DNS TXT-t használjon.',
    tlsDoHint:
      'Automatikusan létrehozza a _acme-challenge rekordot, ha a zóna DigitalOceanben van (DO_API_TOKEN). Magától megújul.',
    tlsIspHint:
      'Az ISPConfig Remote JSON API hozza létre a TXT rekordot. A remote usernek DNS zóna, DNS TXT és kliens jogosultság kell. Magától megújul.',
    tlsIspUrl: 'ISPConfig API URL',
    tlsIspUser: 'Remote felhasználó',
    tlsIspPassword: 'Remote jelszó',
    tlsIspTls: 'Panel TLS',
    tlsIspSecure: 'Ellenőrzés',
    tlsIspInsecure: 'Bizonytalan engedélyezése',
    tlsDnsHint:
      'Adja hozzá a TXT rekordot a DNS-nél, várjon egy percet, majd folytassa. A megújítás ugyanígy történik.',
    tlsManualHint:
      'Illesszen be tanúsítványt és kulcsot, vagy állítsa be a SMTP_TLS_CERT_PATH és SMTP_TLS_KEY_PATH változókat.',
    tlsStatusIdle: 'Még nincs tanúsítvány. Mentse a nyilvános gépnevet a kiállításhoz.',
    tlsStatusPending: 'Tanúsítvány kérése a Let’s Encrypt-től…',
    tlsStatusWaitingDns: 'Adja hozzá az alábbi TXT rekordot, majd folytassa.',
    tlsStatusIssued: 'Tanúsítvány kiállítva',
    tlsStatusError: 'A tanúsítványkérés sikertelen',
    tlsExpiresOn: (when) => `Lejár ${when}`,
    tlsRenewsOn: (when) => `Következő megújítás ${when}`,
    tlsIssueNow: 'Kiállítás / megújítás most',
    tlsIssuing: 'Kérés…',
    tlsNoCertYet: 'Még nincs tárolt tanúsítvány.',
    tlsDnsRecordName: 'TXT név',
    tlsDnsRecordValue: 'TXT érték',
    tlsDnsContinue: 'A rekord kész',
    tlsDnsContinuing: 'DNS ellenőrzése…',
    alertTitle: 'Felügyelet és riasztás',
    alertLead:
      'Üzemeltetési értesítések, beleértve a várólistát és a kézbesítési riasztásokat, ide mennek.',
    alertEmail: 'Riasztási e-mail',
    alertFrom: 'Feladó címe',
    save: 'Konfiguráció mentése',
    saved: 'A platformkonfiguráció mentve.',
    saveFailed: 'Mentés sikertelen',
    secretSet: 'Tárolva — új értéket adjon meg a cseréhez',
    testTitle: 'Tesztküldés',
    testLead:
      'Előbb mentse a konfigurációt. Válasszon SES-t vagy SMTP-t. SES esetén a feladónak ellenőrzött identitásnak kell lennie.',
    testVia: 'Kimenet',
    testFrom: 'Feladó',
    testTo: 'Címzett',
    testSend: 'Teszt e-mail küldése',
    testSending: 'Küldés…',
    testSent: (via, id) => `Elküldve (${via}). Üzenetazonosító: ${id}`,
    testFailed: 'A tesztküldés sikertelen',
    testSmtpDisabled: 'A teszteléshez kapcsolja be az SMTP-relét',
  },
  health: {
    title: 'Állapot',
    lead: 'Adatbázis, kimenet, mentések és közelmúltbeli kézbesítés az összes bérlőn.',
    refresh: 'Frissítés',
    loading: 'Ellenőrzés…',
    failed: 'Az állapotellenőrzés sikertelen',
    checkedAt: (when) => `Utolsó ellenőrzés: ${when}`,
    checks: 'Platform-ellenőrzések',
    database: 'Adatbázis',
    ses: 'Amazon SES',
    smtp: 'SMTP-relé',
    backup: 'Mentések',
    ok: 'OK',
    warn: 'Figyelmeztetés',
    down: 'Leállt',
    off: 'Ki',
    degraded: 'Korlátozott',
    latency: (ms) => `${ms} ms`,
    region: (name) => `Régió: ${name}`,
    sesQuota: (sent, max) => `SES 24ó ${sent} / ${max}`,
    detailReachable: 'Elérhető',
    detailSesOk: 'A hitelesítő adatok elfogadva',
    detailSesMissing: 'Nincsenek beállítva a hitelesítő adatok',
    detailSesFallback: 'Nincs beállítva — az SMTP-relé a tartalék',
    detailSmtpOff: 'A relé ki van kapcsolva',
    detailSmtpNoHost: 'Bekapcsolva, de nincs gép',
    detailNotChecked: 'Nincs ellenőrizve',
    detailBackupFresh: 'Az utolsó dump sikeres',
    detailBackupStale: 'Az utolsó dump régebbi a küszöbnél',
    detailBackupFailed: 'Az utolsó ütemezett dump sikertelen',
    detailBackupMissing: 'Még nincs dump',
    detailBackupSchedulerMissing: 'A mentésütemező nem észlelhető',
    lastDump: (when) => `Utolsó dump: ${when}`,
    volume24h: 'Elmúlt 24 óra',
    volume7d: 'Elmúlt 7 nap',
    total: 'Összesen',
    sent: 'Elküldve',
    delivered: 'Kézbesítve',
    pending: 'Függőben',
    bounced: 'Visszadobva',
    complained: 'Panasz',
    failedStatus: 'Sikertelen',
    inventory: 'Leltár',
    tenants: 'Bérlők',
    active: 'Aktív',
    domains: 'Domainek',
    verified: 'Ellenőrzött',
    pendingDomains: 'Függőben',
    failedDomains: 'Sikertelen',
    topTenants: 'Top bérlők (7 nap)',
    emptyTenants: 'Nincs küldés az elmúlt 7 napban.',
    recentFailures: 'Legutóbbi hibák',
    emptyFailures: 'Nincs sikertelen, visszadobott vagy panaszos üzenet.',
    when: 'Idő',
    tenant: 'Bérlő',
    from: 'Feladó',
    to: 'Címzett',
    subject: 'Tárgy',
    status: 'Állapot',
  },
  tabs: {
    domainsTitle: 'Domainek',
    apiKeysTitle: 'API-kulcsok',
    logsTitle: 'E-mail naplók',
    logsLead: 'A RelayHorizon-bérlőn keresztül küldött levelek áttekintése.',
  },
  domains: {
    kicker: 'Bérlő / domainek',
    lead:
      'A küldés mindaddig zárva marad, amíg az MX, SPF, DKIM és DMARC nem egyezik a listázott rekordokkal.',
    add: 'Domain hozzáadása',
    adding: 'Hozzáadás…',
    placeholder: 'mail.example.com',
    empty: 'Még nincs domain. Adjon hozzá egyet a DNS-rekordokhoz.',
    records: 'DNS-rekordok',
    check: 'Rekordok ellenőrzése',
    checking: 'Ellenőrzés…',
    copy: 'Másolás',
    type: 'Típus',
    name: 'Név',
    value: 'Érték',
    purpose: 'Cél',
    status: 'Állapot',
    valid: 'Érvényes',
    invalid: 'Érvénytelen',
    pending: 'Függő',
    verified: 'Ellenőrizve',
    failed: 'Sikertelen',
    cannotSend: 'A küldés mindaddig tiltott, amíg minden kötelező rekord érvényes.',
    delete: 'Törlés',
    confirmDelete: 'Törli ezt a domaint?',
    added: 'Hozzáadva',
    hide: 'Rekordok elrejtése',
    dnsTitle: 'DNS-ellenőrzés',
    sesRecords: 'SES-rekordok',
    smtpRecords: 'SMTP-rekordok',
    noDomainYet: 'Még nincs domain',
    emptyTitle: 'Még nincsenek domainek',
    expectedValue: 'Várt érték',
    host: 'Host',
    state: 'Állapot',
    addFailed: 'A domain hozzáadása sikertelen',
    verifyFailed: 'A domain ellenőrzése sikertelen',
    deleteFailed: 'A domain törlése sikertelen',
    copyFailed: 'A másolás sikertelen',
  },
  keys: {
    title: 'API-hitelesítő adatok',
    create: 'API-kulcs létrehozása',
    createSubmit: 'Kulcs létrehozása',
    creating: 'Létrehozás…',
    copyOnce: 'Egyszer másolható',
    copy: 'Másolás',
    copied: 'Másolva',
    copyFailed: 'A másolás sikertelen',
    domain: 'Domain',
    selectDomain: 'Domain választása',
    label: 'Címke',
    labelPlaceholder: 'Produkció',
    cancel: 'Mégse',
    emptyTitle: 'Nincs API-kulcs',
    emptyBody: 'Hozza létre az első API-kulcsot a küldéshez.',
    prefix: 'Kulcselőtag',
    scope: 'Hatáskör',
    lastUsed: 'Utoljára használva',
    confirmDelete: 'Biztosan törli ezt az API-kulcsot? A művelet nem vonható vissza.',
    needVerified: 'Először adjon hozzá és igazoljon egy domaint a Domainek lapon.',
    chooseFields: 'Válasszon domaint és címkét.',
    createFailed: 'Az API-kulcs létrehozása sikertelen',
    deleteFailed: 'Az API-kulcs törlése sikertelen',
    delete: 'Törlés',
    minutesAgo: (n) => `${n} p. ezelőtt`,
    hoursAgo: (n) => `${n} ó. ezelőtt`,
  },
  logs: {
    title: 'Üzenetesemények',
    search: 'Üzenetazonosító vagy címzett',
    anyStatus: 'Bármely állapot',
    delivered: 'Kézbesítve',
    bounced: 'Visszafordult',
    sent: 'Elküldve',
    failed: 'Sikertelen',
    complained: 'Panasz',
    apply: 'Alkalmaz',
    emptyTitle: 'Nincs illeszkedő esemény',
    emptyBody: 'Módosítsa a szűrőket, vagy küldjön üzenetet ezen a bérlőn.',
    subject: 'Tárgy',
    recipient: 'Címzett',
    status: 'Állapot',
    domain: 'Domain',
    sentAt: 'Elküldve',
    previous: 'Előző',
    next: 'Következő',
    pageOf: (page, total) => `${page}. / ${total}. oldal`,
    details: 'E-mail részletei',
    from: 'Feladó',
    to: 'Címzett',
    created: 'Létrehozva',
    textContent: 'Szöveges tartalom',
    close: 'Bezárás',
    noSubject: '(Nincs tárgy)',
    loadFailed: 'Az e-mail részletei nem tölthetők be',
  },
  portalLogs: {
    searchTitle: 'Kézbesítés keresése',
    searchLead: 'Keresés az összes bérlő küldéseiben. A lista nem tartalmaz törzset.',
    anyTenant: 'Bármely bérlő',
    retainTitle: 'Megőrzés és export',
    retainLead:
      'Régi sorok törlése vagy HTML/szöveg eltávolítása napok után. 0 kikapcsolja. A konténer-stdout a Dokployban marad.',
    keepDays: 'Sorok megőrzése (nap)',
    stripDays: 'Törzs törlése ennyi nap után',
    saveRetention: 'Megőrzés mentése',
    rotateNow: 'Forgatás most',
    exportOps: 'Ops napló export',
    retentionSaved: 'Megőrzés mentve.',
    rotated: (purged, stripped) =>
      `Forgatva: ${purged} törölve, ${stripped} tisztítva.`,
    lastRotate: (when, purged, stripped) =>
      `Utolsó forgatás ${when}: ${purged} törölve, ${stripped} tisztítva.`,
    failed: 'A platformnaplók nem tölthetők be',
  },
  backups: {
    statusTitle: 'Adatbázis-mentések',
    statusLead:
      'Teljes Postgres dumpok. Titokként kezeld. A visszaállítás lecseréli ezt a példányt.',
    lastSuccess: 'Utolsó siker',
    scheduler: 'Ütemező',
    schedulerMissing: 'Nincs észlelve — indítsd a db-backup szolgáltatást',
    lastOffsite: 'Utolsó külső feltöltés',
    stale: 'elavult',
    exportNow: 'Export most',
    exported: 'Dump kész.',
    scheduleTitle: 'Ütemezés',
    scheduleEnabled: 'Ütemezett dumpok',
    interval: 'Intervallum',
    saveSchedule: 'Ütemezés mentése',
    scheduleSaved: 'Ütemezés mentve.',
    on: 'Be',
    off: 'Ki',
    retentionTitle: 'Dump forgatás',
    keepDaily: 'Napi megtartás',
    keepWeekly: 'Heti megtartás',
    keepMonthly: 'Havi megtartás',
    autoRotate: 'Automatikus forgatás',
    saveRetention: 'Forgatás mentése',
    retentionSaved: 'Forgatás mentve.',
    artifactsTitle: 'Helyi dumpok',
    emptyTitle: 'Még nincs dump',
    emptyBody: 'Exportálj most, vagy várd a sidecar-t.',
    artifact: 'Fájl',
    size: 'Méret',
    modified: 'Módosítva',
    download: 'Letöltés',
    push: 'Küldés',
    delete: 'Törlés',
    deleted: 'Dump törölve.',
    pushed: 'Külső tárhelyre küldve.',
    importTitle: 'Visszaállítás',
    importLead: 'Írd be: REPLACE. Ez kiüríti a jelenlegi adatbázist.',
    importFile: 'Dump fájl',
    confirmReplace: 'Megerősítés',
    importNow: 'Import és csere',
    imported: 'Adatbázis cserélve. Indítsd újra a webet, ha a pool elakad.',
    offsiteTitle: 'S3-kompatibilis külső tár',
    offsiteLead: 'Opcionális távoli másolat minden export után. Üres titok megtartja a tárolt értéket.',
    offsiteEnabled: 'Külső feltöltés',
    endpoint: 'Végpont',
    region: 'Régió',
    bucket: 'Bucket',
    prefix: 'Előtag',
    accessKey: 'Access key',
    secretKey: 'Secret key',
    pathStyle: 'Path-style URL',
    saveOffsite: 'Külső tár mentése',
    offsiteSaved: 'Külső tár mentve.',
    testOffsite: 'Kapcsolat teszt',
    testOk: 'A bucket elérhető.',
    pushLatest: 'Legutóbbi küldése',
    failed: 'A mentési kérés sikertelen',
  },
};

export const dictionaries: Record<Locale, Dict> = { en, de, hu };
export type Messages = Dict;
