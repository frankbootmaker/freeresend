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
    alertTitle: string;
    alertLead: string;
    alertEmail: string;
    alertFrom: string;
    save: string;
    saved: string;
    saveFailed: string;
    secretSet: string;
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
    routeSmtp: 'SMTP :2525',
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
    smtpIngressHint: 'SMTP submission on port 2525',
    bothHint: 'Accept both HTTPS and SMTP',
    smtpSubmit: 'SMTP submission',
    smtpSubmitHint: 'Username is outpost. Password is an API key.',
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
    alertTitle: 'Monitoring and alerts',
    alertLead:
      'Operational notices, including waitlist and delivery alerts, go to this address.',
    alertEmail: 'Alert email',
    alertFrom: 'From address',
    save: 'Save configuration',
    saved: 'Platform configuration saved.',
    saveFailed: 'Save failed',
    secretSet: 'Stored — enter a new value to rotate',
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
    routeSmtp: 'SMTP :2525',
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
    smtpIngressHint: 'SMTP-Submission auf Port 2525',
    bothHint: 'HTTPS und SMTP akzeptieren',
    smtpSubmit: 'SMTP-Submission',
    smtpSubmitHint: 'Benutzername ist outpost. Passwort ist ein API-Schlüssel.',
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
    alertTitle: 'Überwachung und Alarmierung',
    alertLead:
      'Betriebshinweise, inklusive Warteliste und Zustellalarme, gehen an diese Adresse.',
    alertEmail: 'Alarm-E-Mail',
    alertFrom: 'Absenderadresse',
    save: 'Konfiguration speichern',
    saved: 'Plattformkonfiguration gespeichert.',
    saveFailed: 'Speichern fehlgeschlagen',
    secretSet: 'Gespeichert — neuen Wert eingeben zum Rotieren',
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
    routeSmtp: 'SMTP :2525',
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
    smtpIngressHint: 'SMTP beküldés a 2525-ös porton',
    bothHint: 'HTTPS és SMTP is elfogadott',
    smtpSubmit: 'SMTP beküldés',
    smtpSubmitHint: 'A felhasználónév outpost. A jelszó egy API-kulcs.',
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
    alertTitle: 'Felügyelet és riasztás',
    alertLead:
      'Üzemeltetési értesítések, beleértve a várólistát és a kézbesítési riasztásokat, ide mennek.',
    alertEmail: 'Riasztási e-mail',
    alertFrom: 'Feladó címe',
    save: 'Konfiguráció mentése',
    saved: 'A platformkonfiguráció mentve.',
    saveFailed: 'Mentés sikertelen',
    secretSet: 'Tárolva — új értéket adjon meg a cseréhez',
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
};

export const dictionaries: Record<Locale, Dict> = { en, de, hu };
export type Messages = Dict;
