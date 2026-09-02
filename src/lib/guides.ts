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
        ],
      },
      {
        id: 'users',
        title: 'Users',
        paragraphs: [
          'People who can open this portal. Create a new administrator or promote an existing account by email.',
          'You cannot revoke yourself or the last administrator. Revoke only clears portal access.',
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
          'Search delivery across tenants. Set retention here, then Rotate now.',
          'The same rotation runs on POST /api/cron/ops with header x-cron-secret.',
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
          'Set SES credentials, an optional platform SMTP relay, inbound SMTP TLS, alert addresses, and Authentik/OIDC sign-in.',
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
          'Create an organization on the landing page for self-signup, or provision customers from this portal.',
        ],
      },
      {
        id: 'first-send',
        title: 'First send',
        paragraphs: [
          'In production, do not set SKIP_DNS_VERIFICATION.',
          'Add a domain, publish MX, SPF, DKIM, and DMARC exactly as listed, then Check records.',
          'Send a test with curl, the Resend SDK (RESEND_BASE_URL), or SMTP (username relayhorizon, password is an API key).',
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
        ],
      },
      {
        id: 'users',
        title: 'Benutzer',
        paragraphs: [
          'Personen mit Zugang zu diesem Portal. Neuen Administrator anlegen oder ein bestehendes Konto per E-Mail befördern.',
          'Sie können sich selbst oder den letzten Administrator nicht entziehen. Entzug nimmt nur den Portalzugang.',
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
          'Zustellung über alle Mandanten suchen. Aufbewahrung hier setzen, dann Jetzt rotieren.',
          'Dieselbe Rotation läuft über POST /api/cron/ops mit Header x-cron-secret.',
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
          'SES-Zugangsdaten, optionales Plattform-SMTP-Relais, eingehendes SMTP-TLS, Alert-Adressen und Authentik/OIDC-Anmeldung.',
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
          'Organisation auf der Landingpage selbst anlegen, oder Kunden hier im Portal provisionieren.',
        ],
      },
      {
        id: 'first-send',
        title: 'Erster Versand',
        paragraphs: [
          'In Produktion SKIP_DNS_VERIFICATION nicht setzen.',
          'Domain anlegen, MX, SPF, DKIM und DMARC genau wie angezeigt veröffentlichen, dann Records prüfen.',
          'Test mit curl, Resend-SDK (RESEND_BASE_URL) oder SMTP (Benutzername relayhorizon, Passwort ist ein API-Schlüssel).',
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
        ],
      },
      {
        id: 'users',
        title: 'Felhasználók',
        paragraphs: [
          'Akik megnyithatják ezt a portált. Új admint hozhat létre, vagy meglévő fiókot emelhet e-mail alapján.',
          'Saját magát vagy az utolsó admint nem vonhatja vissza. A visszavonás csak a portálhozzáférést törli.',
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
          'Kézbesítés keresése az összes bérlőn. Itt állítsa a megőrzést, majd Forgatás most.',
          'Ugyanez fut a POST /api/cron/ops hívással, x-cron-secret fejléccel.',
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
          'SES-hitelesítő adatok, opcionális platform SMTP-relé, bejövő SMTP TLS, riasztási címek és Authentik/OIDC-belépés.',
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
          'Szervezetet a nyitóoldalon hozhat létre, vagy ügyfeleket itt a portálon hozhat létre.',
        ],
      },
      {
        id: 'first-send',
        title: 'Első küldés',
        paragraphs: [
          'Élesben ne állítsa be a SKIP_DNS_VERIFICATION értékét.',
          'Adjon hozzá domaint, tegye közzé a listázott MX, SPF, DKIM és DMARC rekordokat, majd ellenőrizze őket.',
          'Teszteljen curl-lel, Resend SDK-val (RESEND_BASE_URL) vagy SMTP-vel (felhasználó: relayhorizon, jelszó: API-kulcs).',
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
          'HTTPS is Resend-compatible POST /api/emails with a Bearer API key.',
          'SMTP username is relayhorizon. The password is an API key. Closed channels return HTTPS 403 or SMTP 535/550.',
          'SES uses the platform AWS keys. SMTP egress uses your upstream host, or the platform relay if you leave host empty.',
        ],
      },
      {
        id: 'domains',
        title: 'Domains',
        paragraphs: [
          'Add the sending domain, then publish MX, SPF, DKIM, and DMARC exactly as listed.',
          'Bounce MX is on outbound.{domain} so existing inbound MX is left alone.',
          'Sending stays blocked until Check records passes.',
        ],
      },
      {
        id: 'keys',
        title: 'API keys',
        paragraphs: [
          'Create a key (frs_…). Copy it once.',
          'Use it as the Authorization Bearer token or as the SMTP password.',
        ],
      },
      {
        id: 'smtp',
        title: 'SMTP submission',
        paragraphs: [
          'Typical ports are 587 and 2525. TLS is set by the platform.',
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
          'Delivery events for this tenant.',
          'Bounces and complaints update after SES SNS is connected to /api/webhooks/ses.',
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
          'HTTPS ist Resend-kompatibel: POST /api/emails mit Bearer-API-Schlüssel.',
          'SMTP-Benutzername ist relayhorizon. Das Passwort ist ein API-Schlüssel. Geschlossene Kanäle liefern HTTPS 403 oder SMTP 535/550.',
          'SES nutzt die Plattform-AWS-Schlüssel. SMTP-Egress nutzt Ihren Upstream oder das Plattform-Relais, wenn der Host leer bleibt.',
        ],
      },
      {
        id: 'domains',
        title: 'Domains',
        paragraphs: [
          'Versanddomain anlegen und MX, SPF, DKIM sowie DMARC genau wie angezeigt veröffentlichen.',
          'Bounce-MX liegt auf outbound.{domain}, damit bestehendes Inbound-MX unberührt bleibt.',
          'Der Versand bleibt gesperrt, bis Records prüfen erfolgreich ist.',
        ],
      },
      {
        id: 'keys',
        title: 'API-Schlüssel',
        paragraphs: [
          'Schlüssel (frs_…) anlegen und einmal kopieren.',
          'Als Authorization-Bearer oder als SMTP-Passwort verwenden.',
        ],
      },
      {
        id: 'smtp',
        title: 'SMTP-Submission',
        paragraphs: [
          'Übliche Ports sind 587 und 2525. TLS setzt die Plattform.',
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
          'Zustellereignisse dieses Mandanten.',
          'Bounces und Complaints erscheinen, sobald SES-SNS auf /api/webhooks/ses zeigt.',
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
          'A HTTPS Resend-kompatibilis POST /api/emails Bearer API-kulccsal.',
          'Az SMTP felhasználónév: relayhorizon. A jelszó egy API-kulcs. Lezárt csatorna HTTPS 403 vagy SMTP 535/550.',
          'A SES a platform AWS-kulcsait használja. SMTP kimenetnél a saját upstream, vagy üres hostnál a platform relé.',
        ],
      },
      {
        id: 'domains',
        title: 'Domainek',
        paragraphs: [
          'Adja hozzá a küldő domaint, majd tegye közzé a listázott MX, SPF, DKIM és DMARC rekordokat.',
          'A bounce MX az outbound.{domain} címen van, hogy a meglévő bejövő MX megmaradjon.',
          'A küldés addig tiltott, amíg a rekordellenőrzés nem sikerül.',
        ],
      },
      {
        id: 'keys',
        title: 'API-kulcsok',
        paragraphs: [
          'Hozzon létre kulcsot (frs_…), és másolja egyszer.',
          'Authorization Bearer tokentként vagy SMTP-jelszóként használja.',
        ],
      },
      {
        id: 'smtp',
        title: 'SMTP-beküldés',
        paragraphs: [
          'A szokásos portok a 587 és a 2525. A TLS-t a platform állítja.',
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
          'Ennek a bérlőnek a kézbesítési eseményei.',
          'A bounce és a complaint akkor frissül, ha a SES SNS a /api/webhooks/ses címre mutat.',
        ],
      },
    ],
  },
};

export function getGuide(kind: GuideKind, locale: Locale): Guide {
  const catalog = kind === 'admin' ? ADMIN : TENANT;
  return catalog[locale] ?? catalog.en;
}
