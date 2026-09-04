import type { Locale } from './i18n';

export type GuideKind = 'admin' | 'tenant';

export type GuideSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type Guide = {
  title: string;
  lead: string;
  sections: GuideSection[];
};

const ADMIN: Record<Locale, Guide> = {
  en: {
    title: 'Administrator guide',
    lead: 'How to run this RelayHorizon installation from the portal.',
    sections: [
      {
        id: 'portal',
        title: 'This portal',
        paragraphs: [
          'Platform administrators work here. Customers send mail from their own tenant console.',
          'After you create a customer, use Open tenant to work in that organization.',
        ],
      },
      {
        id: 'health',
        title: 'Health',
        paragraphs: [
          'Checks Postgres, SES or the SMTP relay, and the backup sidecar.',
          'A missing backup heartbeat means db-backup is not running or the shared volume is not mounted on web.',
        ],
      },
      {
        id: 'customers',
        title: 'Customers',
        paragraphs: [
          'Create an organization, an owner, and an optional sending domain.',
          'Copy the API key and MCP token immediately. They are shown once.',
          'Manage opens a panel to rename the organization, assign the sending pool (probation / shared / BYO / dedicated) and billing mode (exempt / invoiced — invoiced does not charge a card yet), override hour / day / month caps, or delete the tenant. The slug stays as the identifier. The platform tenant cannot be deleted.',
          'Approve or Deny a bring-your-own SES request from Manage, or allow BYO before they ask. Approving also moves the tenant to the BYO pool. The registry Filter can show requested or approved BYO.',
          'The tenant Abuse tab is read-only sending health (pool, caps, 24-hour bounce and complaint rates, suppressions, freeze). If the SES webhook freezes sending, unfreeze from Manage or from the portal Abuse queue. Tenants cannot unfreeze themselves.',
          'Long lists are paged. Choose 5, 10, 25, or 50 rows per page.',
        ],
      },
      {
        id: 'abuse',
        title: 'Abuse',
        paragraphs: [
          'The portal Abuse tab lists every tenant with used caps, last-24-hour bounce and complaint rates, suppressions, and open warnings.',
          'Open warnings is the queue: frozen tenants and anyone near a cap or the 24-hour tripwire. All tenants shows the rest.',
          'Open tenant to work in that console. Unfreeze sending from this table when the SES webhook tripped. Assign pools and caps on Customers → Manage.',
        ],
      },
      {
        id: 'users',
        title: 'Users',
        paragraphs: [
          'People who can open this portal. Create a new administrator or promote an existing account by email.',
          'You cannot revoke or delete yourself or the last administrator. Revoke only clears portal access. Delete removes the account.',
          'The user list uses the same page sizes as Customers.',
        ],
      },
      {
        id: 'agents',
        title: 'Agents',
        paragraphs: [
          'Platform MCP tokens act as an administrator. Point the client at /mcp and copy the token once.',
          'Tenant Agents tokens stay inside one organization and cannot switch customers.',
        ],
      },
      {
        id: 'logs',
        title: 'Logs',
        paragraphs: [
          'Search delivery across tenants by recipient or message id, then Apply. Choose 5, 10, 25, or 50 rows per page.',
          'Set retention here, then Rotate now. The same rotation runs on POST /api/cron/ops with header x-cron-secret.',
        ],
      },
      {
        id: 'backups',
        title: 'Backups',
        paragraphs: [
          'Dumps are pg_dump files on the shared backups volume. A restore replaces the whole database.',
          'After a CLI restore, restart web so connection pools recover. Optional S3 offsite is configured here.',
        ],
      },
      {
        id: 'configuration',
        title: 'Configuration',
        paragraphs: [
          'System domain attaches the platform sending domain (the current web host is the usual start), shows the DNS records to publish, and locks the programmatic From to that domain.',
          'Set SES credentials, an optional platform SMTP relay, inbound SMTP TLS (needed before remote clients accept STARTTLS on 587), alert addresses, and Authentik/OIDC sign-in.',
          'For OIDC, paste the issuer, client ID, and secret from Authentik, and copy the callback URL into the provider application.',
          'Optional sign-in button label appears on the console Sign in page when OIDC is enabled. Leave it blank for the locale default (Continue with Authentik).',
          'JIT accounts creates a local user on first sign-in. Leave it off to allow only people already in Users. An optional group grants portal administrator access.',
          'Empty fields or ******** keep a stored secret.',
        ],
      },
      {
        id: 'sign-in',
        title: 'Sign in',
        paragraphs: [
          'One Sign in page for everyone. Platform administrators open this portal; tenant members open their organization console.',
          'Forgot password sends a one-hour reset link using the programmatic From on the system domain.',
          'Password-reset, waitlist, and configuration-test mail use the last website language (EN, DE, or HU) stored on the recipient.',
          'Public Terms, Privacy, and Imprint are at /legal. Self-signup must accept the current version. Admin-provisioned and OIDC JIT accounts skip that checkbox.',
          'Create an organization on the landing page for self-signup, or provision customers from this portal.',
        ],
      },
      {
        id: 'first-send',
        title: 'First send',
        paragraphs: [
          'In production, do not set SKIP_DNS_VERIFICATION.',
          'Add a domain, publish MX, SPF, DKIM, and DMARC exactly as listed, then Check records.',
          'Send a test with curl, the Resend SDK (RESEND_BASE_URL=https://<host>/api, not /api/emails), or SMTP (username relayhorizon, password is an API key).',
          'Remote SMTP clients use port 587. Compose binds 2525 to localhost only. 465 is published but silent unless Configuration includes it.',
          'The smtp Compose profile must be running, and the VPS firewall must allow 587. Traefik does not proxy SMTP.',
          'New tenants start at 5,000 / 20,000 / 100,000 messages per hour / day / month. Hard SES bounces and complaints suppress that address.',
          'A 24-hour bounce rate of 10% over at least 50 messages, or 3 complaints (or 0.1% over at least 100 messages), freezes sending (HTTP 423). Unfreeze from the portal Abuse queue or Customers → Manage. This is not a card-billing freeze.',
          'For SES egress, subscribe SNS to POST /api/webhooks/ses and confirm the subscription in AWS.',
        ],
      },
    ],
  },
  de: {
    title: 'Administratorhandbuch',
    lead: 'So betreiben Sie diese RelayHorizon-Installation im Portal.',
    sections: [
      {
        id: 'portal',
        title: 'Dieses Portal',
        paragraphs: [
          'Plattformadministratoren arbeiten hier. Kunden senden aus ihrer eigenen Mandantenkonsole.',
          'Nach dem Anlegen eines Kunden öffnen Sie den Mandanten mit „Mandant öffnen“.',
        ],
      },
      {
        id: 'health',
        title: 'Status',
        paragraphs: [
          'Prüft Postgres, SES oder das SMTP-Relais und den Backup-Sidecar.',
          'Fehlt der Backup-Heartbeat, läuft db-backup nicht oder das Volume hängt nicht an web.',
        ],
      },
      {
        id: 'customers',
        title: 'Kunden',
        paragraphs: [
          'Legen Sie eine Organisation, einen Owner und optional eine Versanddomain an.',
          'API-Schlüssel und MCP-Token sofort kopieren. Sie werden nur einmal angezeigt.',
          'Verwalten öffnet ein Panel zum Umbenennen, Zuweisen des Versandpools (Probe / Geteilt / Eigenes SES / Dediziert) und des Abrechnungsmodus (befreit / in Rechnung — „in Rechnung“ belastet noch keine Karte), Überschreiben der Stunden-/Tages-/Monatsgrenzen oder Löschen. Der Slug bleibt der Bezeichner. Der Plattformmandant kann nicht gelöscht werden.',
          'Eigenes SES in Verwalten genehmigen oder ablehnen, oder vorher erlauben. Genehmigen verschiebt den Mandanten in den BYO-Pool. Der Filter zeigt angefragte oder genehmigte BYO-Mandanten.',
          'Die Mandanten-Seite Missbrauch ist nur Lesen (Pool, Grenzen, 24-Stunden-Bounce- und Beschwerderaten, Unterdrückungen, Sperre). Wenn der SES-Webhook den Versand sperrt, entsperren Sie in Verwalten oder in der Portal-Warteschlange Missbrauch. Mandanten können das nicht selbst.',
          'Lange Listen sind seitenweise. 5, 10, 25 oder 50 Zeilen pro Seite wählen.',
        ],
      },
      {
        id: 'abuse',
        title: 'Missbrauch',
        paragraphs: [
          'Die Portal-Seite Missbrauch listet jeden Mandanten mit verbrauchten Grenzen, Bounce- und Beschwerderaten der letzten 24 Stunden, Unterdrückungen und offenen Warnungen.',
          'Offene Warnungen ist die Warteschlange: gesperrte Mandanten und wer nahe an einer Grenze oder der 24-Stunden-Schwelle ist. Alle Mandanten zeigt den Rest.',
          'Mandant öffnen wechselt in diese Konsole. Versand entsperren steht in dieser Tabelle, wenn der SES-Webhook ausgelöst hat. Pool und Grenzen unter Kunden → Verwalten.',
        ],
      },
      {
        id: 'users',
        title: 'Benutzer',
        paragraphs: [
          'Personen mit Zugang zu diesem Portal. Neuen Administrator anlegen oder ein bestehendes Konto per E-Mail befördern.',
          'Sie können sich selbst oder den letzten Administrator nicht entziehen oder löschen. Entzug nimmt nur den Portalzugang. Löschen entfernt das Konto.',
          'Die Benutzerliste nutzt dieselben Seitengrößen wie Kunden.',
        ],
      },
      {
        id: 'agents',
        title: 'Agenten',
        paragraphs: [
          'Plattform-MCP-Token handeln als Administrator. Client auf /mcp richten und Token einmal kopieren.',
          'Mandanten-Agenten bleiben in einer Organisation und können keine Kunden wechseln.',
        ],
      },
      {
        id: 'logs',
        title: 'Protokolle',
        paragraphs: [
          'Zustellung über alle Mandanten nach Empfänger oder Nachrichten-ID suchen, dann Anwenden. 5, 10, 25 oder 50 Zeilen pro Seite.',
          'Aufbewahrung hier setzen, dann Jetzt rotieren. Dieselbe Rotation läuft über POST /api/cron/ops mit Header x-cron-secret.',
        ],
      },
      {
        id: 'backups',
        title: 'Backups',
        paragraphs: [
          'Dumps sind pg_dump-Dateien auf dem gemeinsamen Backup-Volume. Ein Restore ersetzt die ganze Datenbank.',
          'Nach einem CLI-Restore web neu starten. Optionales S3-Offsite wird hier konfiguriert.',
        ],
      },
      {
        id: 'configuration',
        title: 'Konfiguration',
        paragraphs: [
          'Unter Systemdomain binden Sie die Plattform-Versanddomain an (meist der aktuelle Webhost), veröffentlichen die DNS-Records und setzen den programmatischen Absender auf diese Domain.',
          'SES-Zugangsdaten, optionales Plattform-SMTP-Relais, eingehendes SMTP-TLS (nötig, bevor entfernte Clients STARTTLS auf 587 akzeptieren), Alert-Adressen und Authentik/OIDC-Anmeldung.',
          'Für OIDC Issuer, Client-ID und Secret aus Authentik eintragen und die Callback-URL in die Provider-Anwendung kopieren.',
          'Optionaler Anmelde-Schaltflächentext erscheint auf der Anmeldeseite, wenn OIDC aktiv ist. Leer lassen für die Sprachvorgabe (Weiter mit Authentik).',
          'JIT-Konten legt beim ersten Anmelden ein lokales Konto an. Ausgeschaltet bleiben nur Personen aus Benutzer. Eine optionale Gruppe gibt Portaladministratorrechte.',
          'Leere Felder oder ******** behalten das gespeicherte Geheimnis.',
        ],
      },
      {
        id: 'sign-in',
        title: 'Anmelden',
        paragraphs: [
          'Eine Anmeldeseite für alle. Plattformadministratoren öffnen dieses Portal; Mandantenmitglieder ihre Organisation.',
          'Passwort vergessen sendet einen einstündigen Link mit dem programmatischen Absender der Systemdomain.',
          'Passwort-Reset, Warteliste und Konfigurationstest verwenden die zuletzt gewählte Website-Sprache (EN, DE oder HU) des Empfängers.',
          'Nutzungsbedingungen, Datenschutz und Impressum liegen unter /legal. Die Selbstregistrierung muss die aktuelle Version akzeptieren. Vom Administrator oder per OIDC-JIT angelegte Konten überspringen die Checkbox.',
          'Organisation auf der Landingpage selbst anlegen, oder Kunden hier im Portal provisionieren.',
        ],
      },
      {
        id: 'first-send',
        title: 'Erster Versand',
        paragraphs: [
          'In Produktion SKIP_DNS_VERIFICATION nicht setzen.',
          'Domain anlegen, MX, SPF, DKIM und DMARC genau wie angezeigt veröffentlichen, dann Records prüfen.',
          'Test mit curl, Resend-SDK (RESEND_BASE_URL=https://<host>/api, nicht /api/emails) oder SMTP (Benutzername relayhorizon, Passwort ist ein API-Schlüssel).',
          'Entfernte SMTP-Clients nutzen Port 587. Compose bindet 2525 nur an localhost. 465 ist veröffentlicht, bleibt aber still, bis die Konfiguration ihn einschließt.',
          'Das Compose-Profil smtp muss laufen, und die VPS-Firewall muss 587 erlauben. Traefik leitet SMTP nicht weiter.',
          'Neue Mandanten starten bei 5.000 / 20.000 / 100.000 Nachrichten pro Stunde / Tag / Monat. Harte SES-Bounces und Beschwerden unterdrücken diese Adresse.',
          'Eine 24-Stunden-Bounce-Rate von 10 % bei mindestens 50 Nachrichten oder 3 Beschwerden (oder 0,1 % bei mindestens 100) sperrt den Versand (HTTP 423). Entsperren unter Missbrauch oder Kunden → Verwalten. Das ist keine Karten-Sperre.',
          'Bei SES-Egress SNS auf POST /api/webhooks/ses abonnieren und in AWS bestätigen.',
        ],
      },
    ],
  },
  hu: {
    title: 'Adminisztrátori útmutató',
    lead: 'Így üzemelteti ezt a RelayHorizon-telepítést a portálon.',
    sections: [
      {
        id: 'portal',
        title: 'Ez a portál',
        paragraphs: [
          'A platformadminisztrátorok itt dolgoznak. Az ügyfelek a saját bérlőkonzoljukról küldenek.',
          'Ügyfél létrehozása után a Bérlő megnyitása gombbal lép be a szervezetbe.',
        ],
      },
      {
        id: 'health',
        title: 'Állapot',
        paragraphs: [
          'A Postgres, a SES vagy az SMTP-relé, és a mentési sidecar állapotát mutatja.',
          'Hiányzó mentési heartbeat azt jelenti, hogy a db-backup nem fut, vagy a kötet nincs a webre csatolva.',
        ],
      },
      {
        id: 'customers',
        title: 'Ügyfelek',
        paragraphs: [
          'Hozzon létre szervezetet, tulajdonost, és opcionálisan küldő domaint.',
          'Az API-kulcsot és az MCP-tokent azonnal másolja. Csak egyszer jelennek meg.',
          'A kezelés panelen átnevezheti a szervezetet, poolt rendelhet (próbaidő / megosztott / saját SES / dedikált) és számlázási módot (mentes / számlázott — a számlázott mód még nem von le kártyáról), órás/napi/havi plafont írhat felül, vagy törölheti a bérlőt. A slug azonosító marad. A platform bérlő nem törölhető.',
          'A saját SES kérést a kezelésben hagyja jóvá vagy utasítsa el, vagy engedélyezze előre. A jóváhagyás a saját SES poolba teszi a bérlőt. A szűrő mutatja a kért vagy jóváhagyott saját SES-t.',
          'A bérlő Visszaélés lapja csak olvasható küldési állapot (pool, plafonok, 24 órás visszapattanás és panasz, tiltások, fagyasztás). Ha a SES webhook befagyasztja a küldést, a kezelésben vagy a portál Visszaélés sorában oldja fel. A bérlők maguk nem oldhatják fel.',
          'A hosszú listák lapozhatók. Oldalanként 5, 10, 25 vagy 50 sor.',
        ],
      },
      {
        id: 'abuse',
        title: 'Visszaélés',
        paragraphs: [
          'A portál Visszaélés lapja minden bérlőt listáz: felhasznált plafon, 24 órás visszapattanás és panasz, tiltások és nyitott figyelmeztetések.',
          'A Nyitott figyelmeztetések a sor: befagyasztott bérlők és akik közel vannak a plafonhoz vagy a 24 órás küszöbhöz. A Minden bérlő a többit mutatja.',
          'A Bérlő megnyitása a konzoljára visz. A küldés feloldása ebből a táblából megy, ha a SES webhook leoldott. Poolt és plafont az Ügyfelek → Kezelés lapon állít.',
        ],
      },
      {
        id: 'users',
        title: 'Felhasználók',
        paragraphs: [
          'Akik megnyithatják ezt a portált. Új admint hozhat létre, vagy meglévő fiókot emelhet e-mail alapján.',
          'Saját magát vagy az utolsó admint nem vonhatja vissza és nem törölheti. A visszavonás csak a portálhozzáférést törli. A törlés a fiókot távolítja el.',
          'A felhasználólista ugyanazokat az oldalméreteket használja, mint az Ügyfelek.',
        ],
      },
      {
        id: 'agents',
        title: 'Ügynökök',
        paragraphs: [
          'A platform MCP-tokenek administrátorként járnak el. A klienst a /mcp címre irányítsa, a tokent egyszer másolja.',
          'A bérlő ügynökök egy szervezetben maradnak, és nem váltanak ügyfelet.',
        ],
      },
      {
        id: 'logs',
        title: 'Naplók',
        paragraphs: [
          'Kézbesítés keresése az összes bérlőn címzett vagy üzenetazonosító szerint, majd Alkalmaz. Oldalanként 5, 10, 25 vagy 50 sor.',
          'Itt állítsa a megőrzést, majd Forgatás most. Ugyanez fut a POST /api/cron/ops hívással, x-cron-secret fejléccel.',
        ],
      },
      {
        id: 'backups',
        title: 'Mentések',
        paragraphs: [
          'A dumpok pg_dump fájlok a közös mentési köteten. A visszaállítás a teljes adatbázist cseréli.',
          'CLI-visszaállítás után indítsa újra a webet. Az opcionális S3-ot itt állítja be.',
        ],
      },
      {
        id: 'configuration',
        title: 'Konfiguráció',
        paragraphs: [
          'A Rendszerdomain csatolja a platform küldő domainjét (általában a jelenlegi webhost), megmutatja a DNS-rekordokat, és a programozott feladót ehhez a domainhez köti.',
          'SES-hitelesítő adatok, opcionális platform SMTP-relé, bejövő SMTP TLS (kell, mielőtt távoli kliensek elfogadják a STARTTLS-t a 587-en), riasztási címek és Authentik/OIDC-belépés.',
          'OIDC-nál írja be az Authentik issuer, client ID és secret értékeit, a callback URL-t másolja a provider alkalmazásba.',
          'Opcionális belépő gomb felirat jelenik meg a konzol belépő oldalán, ha az OIDC be van kapcsolva. Üresen a nyelvi alapértelmezés (Folytatás Authentikkal).',
          'A JIT-fiók az első belépéskor helyi felhasználót hoz létre. Kikapcsolva csak a Felhasználókban már meglévők léphetnek be. Opcionális csoport portáladminisztrátori jogot ad.',
          'Üres mező vagy ******** megtartja a tárolt titkot.',
        ],
      },
      {
        id: 'sign-in',
        title: 'Belépés',
        paragraphs: [
          'Egy belépő oldal mindenkinek. A platformadminisztrátorok ezt a portált, a bérlőtagok a szervezetüket nyitják meg.',
          'Az elfelejtett jelszó egyórás linket küld a rendszerdomain programozott feladójával.',
          'A jelszó-visszaállítás, a várólista és a konfigurációs teszt a címzett utoljára használt webhelynyelvét követi (EN, DE vagy HU).',
          'A Felhasználási feltételek, az Adatvédelem és az Impresszum a /legal címen van. Az önregisztrációnak a hatályos verziót kell elfogadnia. Adminisztrátor vagy OIDC JIT által létrehozott fiókoknál a jelölőnégyzet kimarad.',
          'Szervezetet a nyitóoldalon hozhat létre, vagy ügyfeleket itt a portálon hozhat létre.',
        ],
      },
      {
        id: 'first-send',
        title: 'Első küldés',
        paragraphs: [
          'Élesben ne állítsa be a SKIP_DNS_VERIFICATION értékét.',
          'Adjon hozzá domaint, tegye közzé a listázott MX, SPF, DKIM és DMARC rekordokat, majd ellenőrizze őket.',
          'Teszteljen curl-lel, Resend SDK-val (RESEND_BASE_URL=https://<host>/api, ne /api/emails) vagy SMTP-vel (felhasználó: relayhorizon, jelszó: API-kulcs).',
          'Távoli SMTP-kliensek a 587-es portot használják. A Compose a 2525-öt csak localhostra köti. A 465 publikálva van, de csendben marad, amíg a Konfiguráció nem tartalmazza.',
          'Az smtp Compose-profilnak futnia kell, és a VPS tűzfalán a 587-et engedélyezni kell. A Traefik nem továbbítja az SMTP-t.',
          'Az új bérlők 5 000 / 20 000 / 100 000 üzenettel indulnak óránként / naponként / havonta. A kemény SES-visszapattanások és a panaszok tiltják azt a címet.',
          'A 24 órás 10%-os visszapattanás legalább 50 üzenetnél, vagy 3 panasz (illetve 0,1% legalább 100 üzenetnél) befagyasztja a küldést (HTTP 423). Feloldás: Visszaélés vagy Ügyfelek → Kezelés. Ez nem kártyás befagyasztás.',
          'SES kimenetnél iratkoztassa fel az SNS-t a POST /api/webhooks/ses címre, és erősítse meg az AWS-ben.',
        ],
      },
    ],
  },
};

const TENANT: Record<Locale, Guide> = {
  en: {
    title: 'Sending guide',
    lead: 'How this organization sends mail through RelayHorizon.',
    sections: [
      {
        id: 'console',
        title: 'This console',
        paragraphs: [
          'This is the tenant sending console. Ingress is how applications hand mail to RelayHorizon. Egress is how RelayHorizon delivers it.',
          'EN, DE, and HU are in the header. Password-reset mail uses the language you last selected.',
        ],
      },
      {
        id: 'sending',
        title: 'Sending',
        paragraphs: [
          'HTTPS is Resend-compatible. Set RESEND_BASE_URL to https://<host>/api (not /api/emails). Raw clients POST /api/emails with a Bearer API key.',
          'The Sending tab only shows HTTPS or SMTP fields for the ingress you pick. TLS for the upstream relay is on SMTP egress.',
          'SMTP username is relayhorizon. The password is an API key. Closed channels return HTTPS 403 or SMTP 535/550.',
          'SES uses the platform AWS account unless a platform administrator enables bring-your-own SES. Use Request bring-your-own SES on Sending; it stays locked until they approve. SMTP egress uses your upstream host, or the platform relay if you leave host empty.',
          'Default caps are 5,000 messages per rolling hour, 20,000 per calendar day, and 100,000 per calendar month. Hard bounces and complaints are suppressed and further sends to those addresses are rejected.',
        ],
      },
      {
        id: 'domains',
        title: 'Domains',
        paragraphs: [
          'Add the sending domain. Both SES and SMTP record sets are listed; the unused set is dimmed. Publish MX, SPF, DKIM, and DMARC for the live Sending route.',
          'Switching SES and SMTP rebuilds the live set and re-checks. Bounce MX is on outbound.{domain} so existing inbound MX is left alone.',
          'When the platform SMTP relay is enabled, the SES set also authorizes that host and RelayHorizon DKIM so failover can send without a DNS change.',
          'Sending stays blocked until Check records passes on the live set.',
          'Remove a domain from its toolbar when you no longer send from it.',
        ],
      },
      {
        id: 'keys',
        title: 'API keys',
        paragraphs: [
          'Create a key (frs_…). Copy it once.',
          'The table lists label, domain, prefix, scope, and last used. Any member of this organization can delete a key.',
          'Use it as the Authorization Bearer token or as the SMTP password.',
        ],
      },
      {
        id: 'smtp',
        title: 'SMTP submission',
        paragraphs: [
          'Public clients use the host on Sending and port 587. Use STARTTLS when the platform has a certificate.',
          'Port 2525 is only reachable on the server itself (localhost). Do not use it from a remote mail client.',
          'Port 465 is implicit TLS and only works when the platform has enabled it and installed a certificate.',
          'The From address must be on a verified domain in this organization.',
        ],
      },
      {
        id: 'agents',
        title: 'Agents',
        paragraphs: [
          'Tenant MCP tokens are scoped to this organization. Point the client at /mcp.',
          'They cannot create more agents or switch to another customer.',
        ],
      },
      {
        id: 'logs',
        title: 'Logs',
        paragraphs: [
          'Delivery events for this tenant. Filter by recipient or status, then Apply. Choose 5, 10, 25, or 50 rows per page.',
          'Bounces and complaints update after SES SNS is connected to /api/webhooks/ses. Permanent bounces and complaints also join the suppression list.',
        ],
      },
      {
        id: 'abuse',
        title: 'Abuse',
        paragraphs: [
          'Abuse shows the sending pool, used hour / day / month caps, last-24-hour bounce and complaint rates, and how many recipients are suppressed.',
          'Open warnings appear when a cap is near or hit, bounce or complaint rates rise, or the organization is suspended. You cannot raise the pool or turn the checks off.',
          'Reaching a cap returns HTTP 429. Sends to suppressed addresses return 422. A 24-hour bounce rate of 10% over at least 50 messages, or 3 complaints (or 0.1% over at least 100 messages), freezes sending (HTTP 423). An administrator must unfreeze it.',
        ],
      },
      {
        id: 'organization',
        title: 'Organization',
        paragraphs: [
          'The organization name can be changed only by a platform administrator.',
          'Owners can delete this organization under Organization. That is a two-step confirmation: read the warnings, then type the organization name.',
          'Delete removes domains, keys, logs, and accounts that exist only here. The platform tenant cannot be deleted.',
        ],
      },
    ],
  },
  de: {
    title: 'Versandhandbuch',
    lead: 'So sendet diese Organisation über RelayHorizon.',
    sections: [
      {
        id: 'console',
        title: 'Diese Konsole',
        paragraphs: [
          'Das ist die Versandkonsole des Mandanten. Ingress ist, wie Anwendungen Post übergeben. Egress ist, wie RelayHorizon zustellt.',
          'EN, DE und HU stehen in der Kopfzeile. Die Passwort-Reset-Mail nutzt die zuletzt gewählte Sprache.',
        ],
      },
      {
        id: 'sending',
        title: 'Versand',
        paragraphs: [
          'HTTPS ist Resend-kompatibel. RESEND_BASE_URL auf https://<host>/api setzen (nicht /api/emails). Direkte Clients senden POST /api/emails mit Bearer-API-Schlüssel.',
          'Die Versandseite zeigt nur HTTPS- oder SMTP-Felder zum gewählten Ingress. TLS für das Upstream-Relais steht beim SMTP-Egress.',
          'SMTP-Benutzername ist relayhorizon. Das Passwort ist ein API-Schlüssel. Geschlossene Kanäle liefern HTTPS 403 oder SMTP 535/550.',
          'SES nutzt das Plattform-AWS-Konto, bis ein Administrator eigenes SES freischaltet. Nutzen Sie Eigenes SES anfragen auf Versand; es bleibt gesperrt, bis sie genehmigen. SMTP-Egress nutzt Ihren Upstream oder das Plattform-Relais, wenn der Host leer bleibt.',
          'Standardgrenzen sind 5.000 Nachrichten pro gleitender Stunde, 20.000 pro Kalendertag und 100.000 pro Kalendermonat. Harte Bounces und Beschwerden werden unterdrückt; weitere Sendungen an diese Adressen werden abgelehnt.',
        ],
      },
      {
        id: 'domains',
        title: 'Domains',
        paragraphs: [
          'Versanddomain anlegen. SES- und SMTP-Recordsätze werden beide gelistet; der ungenutzte Satz ist abgeblendet. MX, SPF, DKIM und DMARC für die aktive Versandroute veröffentlichen.',
          'Wechsel zwischen SES und SMTP baut den aktiven Satz neu auf und prüft erneut. Bounce-MX liegt auf outbound.{domain}, damit bestehendes Inbound-MX unberührt bleibt.',
          'Wenn das Plattform-SMTP-Relais aktiv ist, autorisiert der SES-Satz diesen Host und RelayHorizon-DKIM, damit ein Failover ohne DNS-Änderung senden kann.',
          'Der Versand bleibt gesperrt, bis Records prüfen auf dem aktiven Satz erfolgreich ist.',
          'Eine Domain entfernen Sie über die Werkzeugleiste, wenn sie nicht mehr sendet.',
        ],
      },
      {
        id: 'keys',
        title: 'API-Schlüssel',
        paragraphs: [
          'Schlüssel (frs_…) anlegen und einmal kopieren.',
          'Die Tabelle zeigt Bezeichnung, Domain, Präfix, Umfang und letzte Nutzung. Jedes Mitglied dieser Organisation kann einen Schlüssel löschen.',
          'Als Authorization-Bearer oder als SMTP-Passwort verwenden.',
        ],
      },
      {
        id: 'smtp',
        title: 'SMTP-Submission',
        paragraphs: [
          'Öffentliche Clients nutzen den Host auf Versand und Port 587. STARTTLS, wenn die Plattform ein Zertifikat hat.',
          'Port 2525 ist nur auf dem Server selbst (localhost) erreichbar. Nicht von einem entfernten Mailclient nutzen.',
          'Port 465 ist implizites TLS und funktioniert nur, wenn die Plattform ihn eingeschaltet und ein Zertifikat gesetzt hat.',
          'Die From-Adresse muss zu einer verifizierten Domain dieser Organisation gehören.',
        ],
      },
      {
        id: 'agents',
        title: 'Agenten',
        paragraphs: [
          'Mandanten-MCP-Token gelten nur für diese Organisation. Client auf /mcp richten.',
          'Sie können keine weiteren Agenten anlegen und keinen anderen Kunden wählen.',
        ],
      },
      {
        id: 'logs',
        title: 'Protokolle',
        paragraphs: [
          'Zustellereignisse dieses Mandanten. Nach Empfänger oder Status filtern, dann Anwenden. 5, 10, 25 oder 50 Zeilen pro Seite.',
          'Bounces und Complaints erscheinen, sobald SES-SNS auf /api/webhooks/ses zeigt. Permanente Bounces und Beschwerden kommen auf die Unterdrückungsliste.',
        ],
      },
      {
        id: 'abuse',
        title: 'Missbrauch',
        paragraphs: [
          'Missbrauch zeigt den Versandpool, verbrauchte Stunden-/Tages-/Monatsgrenzen, Bounce- und Beschwerderaten der letzten 24 Stunden und die Zahl unterdrückter Empfänger.',
          'Offene Warnungen erscheinen nahe oder an der Grenze, bei steigender Bounce- oder Beschwerderate oder wenn die Organisation gesperrt ist. Sie können den Pool nicht anheben und die Prüfungen nicht abschalten.',
          'Eine erreichte Grenze liefert HTTP 429. Sendungen an unterdrückte Adressen liefern 422. Eine 24-Stunden-Bounce-Rate von 10 % bei mindestens 50 Nachrichten oder 3 Beschwerden (oder 0,1 % bei mindestens 100) sperrt den Versand (HTTP 423). Ein Administrator muss entsperren.',
        ],
      },
      {
        id: 'organization',
        title: 'Organisation',
        paragraphs: [
          'Den Organisationsnamen kann nur ein Plattformadministrator ändern.',
          'Inhaber können diese Organisation unter Organisation löschen. Zwei Schritte: Warnungen lesen, dann den Organisationsnamen eingeben.',
          'Löschen entfernt Domains, Schlüssel, Protokolle und Konten, die nur hier existieren. Der Plattformmandant kann nicht gelöscht werden.',
        ],
      },
    ],
  },
  hu: {
    title: 'Küldési útmutató',
    lead: 'Így küld ez a szervezet a RelayHorizonon keresztül.',
    sections: [
      {
        id: 'console',
        title: 'Ez a konzol',
        paragraphs: [
          'Ez a bérlő küldőkonzolja. A bejövő út az, ahogy az alkalmazások átadják a levelet. A kimenő út az, ahogy a RelayHorizon kézbesít.',
          'Az EN, DE és HU a fejlécben van. A jelszó-visszaállító levél az utoljára választott nyelvet használja.',
        ],
      },
      {
        id: 'sending',
        title: 'Küldés',
        paragraphs: [
          'A HTTPS Resend-kompatibilis. A RESEND_BASE_URL legyen https://<host>/api (ne /api/emails). Közvetlen kliens: POST /api/emails Bearer API-kulccsal.',
          'A Küldés lap csak a választott bejövő útnak megfelelő HTTPS- vagy SMTP-mezőket mutatja. Az upstream relé TLS-e a SMTP kimeneten van.',
          'Az SMTP felhasználónév: relayhorizon. A jelszó egy API-kulcs. Lezárt csatorna HTTPS 403 vagy SMTP 535/550.',
          'A SES a platform AWS-fiókot használja, amíg a platformadminisztrátor saját SES-t nem engedélyez. A Küldés lapon a Saját SES kérése gombot használja; zárolva marad, amíg jóvá nem hagyják. SMTP kimenetnél a saját upstream, vagy üres hostnál a platform relé.',
          'Az alapértelmezett korlát 5 000 üzenet gördülő óránként, 20 000 naptári naponként és 100 000 naptári havonta. A kemény visszapattanások és a panaszok tiltólistára kerülnek, ezekre a címekre a további küldés elutasított.',
        ],
      },
      {
        id: 'domains',
        title: 'Domainek',
        paragraphs: [
          'Adja hozzá a küldő domaint. A SES és az SMTP rekordkészlet is listázva van; a nem használt halvány. Tegye közzé az MX, SPF, DKIM és DMARC rekordokat az élő Küldés útvonalhoz.',
          'A SES és SMTP váltása újraépíti és újraellenőrzi az élő készletet. A bounce MX az outbound.{domain} címen van, hogy a meglévő bejövő MX megmaradjon.',
          'Ha a platform SMTP-relé be van kapcsolva, a SES-készlet azt a hostot és a RelayHorizon DKIM-et is engedélyezi, hogy a failover DNS-változás nélkül küldhessen.',
          'A küldés addig tiltott, amíg a rekordellenőrzés az élő készleten nem sikerül.',
          'A domaint az eszköztárról törölheti, ha már nem küld róla.',
        ],
      },
      {
        id: 'keys',
        title: 'API-kulcsok',
        paragraphs: [
          'Hozzon létre kulcsot (frs_…), és másolja egyszer.',
          'A táblázat a címkét, a domaint, az előtagot, a hatókört és az utolsó használatot mutatja. A szervezet bármely tagja törölhet kulcsot.',
          'Authorization Bearer tokentként vagy SMTP-jelszóként használja.',
        ],
      },
      {
        id: 'smtp',
        title: 'SMTP-beküldés',
        paragraphs: [
          'A nyilvános kliensek a Küldés lapon látható hostot és a 587-es portot használják. STARTTLS, ha a platformnak van tanúsítványa.',
          'A 2525-ös port csak a szerveren (localhost) érhető el. Távoli levelezőklienssel ne használja.',
          'A 465 implicit TLS, és csak akkor működik, ha a platform bekapcsolta és van tanúsítvány.',
          'A From címnek ennek a szervezetnek egy ellenőrzött domainjén kell lennie.',
        ],
      },
      {
        id: 'agents',
        title: 'Ügynökök',
        paragraphs: [
          'A bérlő MCP-tokenek erre a szervezetre szűkülnek. A klienst a /mcp címre irányítsa.',
          'Nem hozhatnak létre további ügynököt, és nem válthatnak másik ügyfélre.',
        ],
      },
      {
        id: 'logs',
        title: 'Naplók',
        paragraphs: [
          'Ennek a bérlőnek a kézbesítési eseményei. Szűrjön címzett vagy állapot szerint, majd Alkalmaz. Oldalanként 5, 10, 25 vagy 50 sor.',
          'A bounce és a complaint akkor frissül, ha a SES SNS a /api/webhooks/ses címre mutat. A tartós visszapattanások és a panaszok a tiltólistára is felkerülnek.',
        ],
      },
      {
        id: 'abuse',
        title: 'Visszaélés',
        paragraphs: [
          'A Visszaélés lap mutatja a küldési poolt, a felhasznált óra/nap/hó korlátokat, az elmúlt 24 óra visszapattanási és panaszarányát, és a tiltott címzettek számát.',
          'Figyelmeztetés jelenik meg, ha a plafon közel van vagy elérve, ha nő a visszapattanás vagy a panasz, vagy ha a szervezet fel van függesztve. A poolt nem emelheti, az ellenőrzéseket nem kapcsolhatja ki.',
          'A plafon elérése HTTP 429. Tiltott címekre 422. A 24 órás 10%-os visszapattanás legalább 50 üzenetnél, vagy 3 panasz (illetve 0,1% legalább 100 üzenetnél) befagyasztja a küldést (HTTP 423). Adminisztrátornak kell feloldania.',
        ],
      },
      {
        id: 'organization',
        title: 'Szervezet',
        paragraphs: [
          'A szervezet nevét csak a platformadminisztrátor módosíthatja.',
          'A tulajdonos a Szervezet lapon törölheti a szervezetet. Két lépés: figyelmeztetések, majd a szervezet nevének begépelése.',
          'A törlés eltávolítja a domaineket, kulcsokat, naplókat, és azokat a fiókokat, amelyek csak ide tartoznak. A platform bérlő nem törölhető.',
        ],
      },
    ],
  },
};

export function getGuide(kind: GuideKind, locale: Locale): Guide {
  const catalog = kind === 'admin' ? ADMIN : TENANT;
  return catalog[locale] ?? catalog.en;
}
