import type { Locale } from './locale';

export const LEGAL_COPY: Record<
  Locale,
  Record<'terms' | 'privacy' | 'imprint', string>
> = {
  en: {
    terms: `# Terms of Service

These terms describe the RelayHorizon outbound-email service on this installation, operated by Nethorizon. They apply when you create an organization through self-signup or otherwise use the console, API, or SMTP submission.

They describe the product as it works today. They do not invent card billing, automatic dunning, or VAT invoices — those are not live yet.

If you run a self-hosted copy, replace the Imprint and review these terms before you offer the service to others.

## The service

RelayHorizon lets your organization send transactional email through a Resend-compatible HTTPS API and optional SMTP submission. Delivery uses Amazon SES and/or an SMTP relay configured for the installation or your tenant.

We do not guarantee that platform SES will stay available, stay out of sandbox, or accept every message. When the operator has published failover DNS (SPF and DKIM that also authorize the platform SMTP relay), we may send through that relay if SES is unavailable or unsuitable. Bounce handling on Amazon identities stays with Amazon.

## Accounts

You must provide accurate account details and keep credentials secret. Self-signup requires you to accept the current published version of these Terms, the Privacy policy, and the Imprint. Accounts created by an administrator or through single sign-on may skip that checkbox; lawful use still applies.

We may freeze, suspend, or close an organization for abuse, a security risk, a legal duty, or an obligation the operator has already told you about.

## Sending limits

Each organization has a monthly sending quota. The default is **100,000** messages per calendar month unless the operator assigns a different cap. We may also enforce hourly and daily caps. Reaching a cap can reject further sends until the window resets or the operator raises the limit.

Suspended organizations cannot send.

## Bring-your-own SES

Using your own AWS SES account is a sold option, not a self-serve toggle. You request it; an administrator must allow it. When it is allowed, Amazon bills you for SES. We may require bring-your-own SES for volume, reputation, or policy. Any separate relay or platform fee is agreed with the operator — these terms do not charge it automatically.

## Acceptable use

Send only mail you are allowed to send. Do not use the service for spam, phishing, malware, unlawful content, or to evade suppressions. We may suppress addresses after bounces or complaints, and we may close the account for repeated abuse.

## Logs

We store account, tenant, domain, API-key metadata, and email-event logs needed to operate and debug sending. Retention follows the installation’s log settings. Details are in the Privacy policy.

## Changes

A new document version and effective date are published when these terms change. Self-signup must accept the version then in force. We may later require existing users to accept a new version before they keep using the console.

## Contact

Questions go to the operator of this installation. See the Imprint.
`,
    privacy: `# Privacy policy

This policy describes personal and operational data processed by the RelayHorizon installation you are using. The operator of this installation is Nethorizon (see the Imprint).

## What we store

- Account details: name, email, password hash, optional picture, locale, and — for self-signup — the terms version you accepted and when
- Organization (tenant) settings, domains, DNS check results, and API-key metadata (the secret is stored hashed)
- Email event logs: addresses, subjects, status, provider identifiers, and related webhook events
- Optional identity-provider identifiers if the operator enabled single sign-on

We do not sell the content of your mail. Message bodies are processed to deliver mail and are not kept as a customer-facing archive beyond what the logs and provider retain.

## Why we store it

We use this data to run the console, authenticate you, send and trace mail, enforce quotas and abuse limits, and contact you about the service.

## Retention

Email-log retention follows the installation’s log settings (portal Logs). Account and tenant records last until the organization or user is deleted. Backups, if enabled, keep a copy for the backup schedule.

## Sharing

Mail is handed to Amazon SES and/or the configured SMTP relay so it can be delivered. If you use bring-your-own SES, Amazon processes that traffic on your AWS account. We may share data when required by law or to investigate abuse.

## Your choices

You can update your profile in the console. Organization owners can erase their organization (Danger zone). Portal administrators can delete users they manage. Contact the operator (Imprint) for other requests.

## Contact

Use the administrator or alert address on this installation. See the Imprint.
`,
    imprint: `# Imprint

**Product.** RelayHorizon — programmatic outbound email.

**Operator of this installation.** Nethorizon.

**Company details — to be completed.** Registered office, company registration number, and VAT ID are **not published in this version**. Do not invent or assume an address from any other page.

**Contact.** Write to the administrator or alert address configured on this installation (the address used for waitlist, password-reset, and operational mail). Self-hosted operators must replace this Imprint with their own legal entity before they offer the service to customers.

**Source.** RelayHorizon is derived from FreeResend. The operator of this installation is responsible for the service you use here.
`,
  },
  de: {
    terms: `# Nutzungsbedingungen

Diese Bedingungen beschreiben den RelayHorizon-Dienst für ausgehende E-Mail auf dieser Installation, betrieben von Nethorizon. Sie gelten, wenn Sie über die Selbstregistrierung eine Organisation anlegen oder die Konsole, die API oder die SMTP-Einlieferung nutzen.

Sie beschreiben das Produkt, wie es heute funktioniert. Sie erfinden keine Kartenzahlung, kein automatisches Mahnwesen und keine USt-Rechnungen — das ist noch nicht live.

Wenn Sie eine selbst gehostete Kopie betreiben, ersetzen Sie das Impressum und prüfen Sie diese Bedingungen, bevor Sie den Dienst anderen anbieten.

## Der Dienst

RelayHorizon lässt Ihre Organisation transaktionale E-Mail über eine Resend-kompatible HTTPS-API und optional SMTP senden. Die Zustellung läuft über Amazon SES und/oder ein SMTP-Relay der Installation oder Ihres Mandanten.

Wir garantieren nicht, dass das Plattform-SES verfügbar bleibt, den Sandbox-Modus verlässt oder jede Nachricht annimmt. Wenn der Betreiber Failover-DNS veröffentlicht hat (SPF und DKIM, die auch das Plattform-SMTP-Relay autorisieren), können wir darüber senden, falls SES nicht verfügbar oder ungeeignet ist. Bounce-Verarbeitung auf Amazon-Identitäten bleibt bei Amazon.

## Konten

Sie müssen zutreffende Kontodaten angeben und Zugangsdaten geheim halten. Die Selbstregistrierung verlangt die Zustimmung zur aktuell veröffentlichten Version dieser Bedingungen, der Datenschutzerklärung und des Impressums. Von einem Administrator oder per Single Sign-on angelegte Konten können diese Checkbox überspringen; rechtmäßige Nutzung gilt trotzdem.

Wir können eine Organisation einfrieren, sperren oder schließen bei Missbrauch, Sicherheitsrisiko, rechtlicher Pflicht oder einer Verpflichtung, die der Betreiber Ihnen bereits mitgeteilt hat.

## Versandgrenzen

Jede Organisation hat ein monatliches Versandkontingent. Standard sind **100.000** Nachrichten pro Kalendermonat, sofern der Betreiber keine andere Grenze setzt. Wir können zusätzlich Stunden- und Tagesgrenzen durchsetzen. Ist die Grenze erreicht, können weitere Sendungen abgelehnt werden, bis das Fenster neu beginnt oder der Betreiber das Limit anhebt.

Gesperrte Organisationen können nicht senden.

## Eigenes SES (BYO)

Ein eigenes AWS-SES-Konto ist eine verkaufte Option, kein Selbstbedienungsschalter. Sie beantragen es; ein Administrator muss es zulassen. Ist es zugelassen, rechnet Amazon SES mit Ihnen ab. Wir können eigenes SES aus Mengen-, Reputations- oder Richtliniengründen verlangen. Eine gesonderte Relay- oder Plattformgebühr wird mit dem Betreiber vereinbart — diese Bedingungen ziehen sie nicht automatisch ein.

## Zulässige Nutzung

Senden Sie nur Mail, die Sie senden dürfen. Nutzen Sie den Dienst nicht für Spam, Phishing, Schadsoftware, rechtswidrige Inhalte oder um Unterdrückungen zu umgehen. Wir können Adressen nach Bounces oder Beschwerden unterdrücken und das Konto bei wiederholtem Missbrauch schließen.

## Protokolle

Wir speichern Konto-, Mandanten-, Domain- und API-Schlüssel-Metadaten sowie E-Mail-Ereignisprotokolle, die für Betrieb und Fehlersuche nötig sind. Die Aufbewahrung folgt den Protokolleinstellungen der Installation. Einzelheiten stehen in der Datenschutzerklärung.

## Änderungen

Bei Änderungen erscheinen eine neue Dokumentversion und ein Wirksamkeitsdatum. Die Selbstregistrierung muss die dann geltende Version akzeptieren. Wir können bestehende Nutzer später um erneute Zustimmung bitten, bevor sie die Konsole weiter nutzen.

## Kontakt

Fragen gehen an den Betreiber dieser Installation. Siehe Impressum.
`,
    privacy: `# Datenschutzerklärung

Diese Erklärung beschreibt personenbezogene und betriebliche Daten, die die von Ihnen genutzte RelayHorizon-Installation verarbeitet. Betreiber dieser Installation ist Nethorizon (siehe Impressum).

## Was wir speichern

- Kontodaten: Name, E-Mail, Passwort-Hash, optionales Bild, Sprache und — bei Selbstregistrierung — die akzeptierte Version der Bedingungen samt Zeitpunkt
- Einstellungen der Organisation (Mandant), Domains, DNS-Prüfergebnisse und API-Schlüssel-Metadaten (das Geheimnis liegt gehasht)
- E-Mail-Ereignisprotokolle: Adressen, Betreff, Status, Anbieterkennungen und zugehörige Webhook-Ereignisse
- Optionale Kennungen des Identitätsanbieters, wenn der Betreiber Single Sign-on eingeschaltet hat

Wir verkaufen den Inhalt Ihrer Mail nicht. Nachrichtenkörper werden zur Zustellung verarbeitet und nicht als kundenorientiertes Archiv über das hinaus aufbewahrt, was Protokolle und Anbieter behalten.

## Warum wir speichern

Wir nutzen diese Daten, um die Konsole zu betreiben, Sie anzumelden, Mail zu senden und nachzuvollziehen, Kontingente und Missbrauchslimits durchzusetzen und Sie zum Dienst zu kontaktieren.

## Aufbewahrung

Die Aufbewahrung der E-Mail-Protokolle folgt den Einstellungen der Installation (Portal Protokolle). Konto- und Mandantendaten bleiben, bis die Organisation oder der Nutzer gelöscht wird. Sicherungen, falls aktiv, folgen dem Sicherungsplan.

## Weitergabe

Mail geht an Amazon SES und/oder das konfigurierte SMTP-Relay, damit sie zugestellt werden kann. Nutzen Sie eigenes SES, verarbeitet Amazon den Verkehr auf Ihrem AWS-Konto. Wir können Daten weitergeben, wenn das Gesetz es verlangt oder wir Missbrauch prüfen.

## Ihre Wahl

Sie können Ihr Profil in der Konsole ändern. Eigentümer können ihre Organisation löschen (Gefahrenzone). Portaladministratoren können von ihnen verwaltete Nutzer löschen. Andere Anliegen richten Sie an den Betreiber (Impressum).

## Kontakt

Nutzen Sie die Administrator- oder Alert-Adresse dieser Installation. Siehe Impressum.
`,
    imprint: `# Impressum

**Produkt.** RelayHorizon — programmatische ausgehende E-Mail.

**Betreiber dieser Installation.** Nethorizon.

**Angaben zur Gesellschaft — noch auszufüllen.** Sitz, Handelsregisternummer und USt-IdNr. sind **in dieser Version nicht veröffentlicht**. Leiten Sie keine Adresse von einer anderen Seite ab.

**Kontakt.** Schreiben Sie an die Administrator- oder Alert-Adresse dieser Installation (die Adresse für Warteliste, Passwort-Reset und Betriebshinweise). Selbst Hoster müssen dieses Impressum durch ihre eigene Rechtseinheit ersetzen, bevor sie den Dienst Kunden anbieten.

**Quelle.** RelayHorizon basiert auf FreeResend. Verantwortlich für den hier genutzten Dienst ist der Betreiber dieser Installation.
`,
  },
  hu: {
    terms: `# Felhasználási feltételek

Ezek a feltételek a RelayHorizon kimenő e-mail szolgáltatást írják le ezen a telepítésen, amelyet a Nethorizon üzemeltet. Akkor érvényesek, ha önregisztrációval hoz létre szervezetet, vagy a konzolt, az API-t vagy az SMTP-beküldést használja.

A terméket úgy írják le, ahogy ma működik. Nem találnak ki kártyás fizetést, automatikus felszólítást vagy áfás számlát — ezek még nincsenek élesben.

Ha saját hosztolású példányt üzemeltet, cserélje le az Impresszumot, és nézze át ezeket a feltételeket, mielőtt másoknak kínálja a szolgáltatást.

## A szolgáltatás

A RelayHorizon transzakciós e-mailt küld Resend-kompatibilis HTTPS API-n és opcionális SMTP-beküldésen. A kézbesítés Amazon SES-en és/vagy a telepítés vagy a bérlő SMTP-reléjén megy.

Nem garantáljuk, hogy a platform SES elérhető marad, kikerül a sandboxból, vagy minden üzenetet elfogad. Ha az üzemeltető közzétette a failover DNS-t (SPF és DKIM, amely a platform SMTP-relét is engedélyezi), SES kiesésekor vagy alkalmatlanságakor azon a relén is küldhetünk. Az Amazon-identitások visszapattanását az Amazon kezeli.

## Fiókok

Pontos fiókadatokat kell megadnia, és a belépési adatokat titokban kell tartania. Az önregisztrációhoz el kell fogadnia a jelenleg közzétett Felhasználási feltételeket, az Adatvédelmi tájékoztatót és az Impresszumot. Adminisztrátor vagy egyszeri belépés által létrehozott fiókoknál ez a jelölőnégyzet kimaradhat; a jogszerű használat akkor is érvényes.

Visszaélés, biztonsági kockázat, jogi kötelezettség vagy olyan tartozás miatt, amelyről az üzemeltető már tájékoztatta, a szervezetet befagyaszthatjuk, felfüggeszthetjük vagy bezárhatjuk.

## Küldési korlátok

Minden szervezetnek havi küldési kvótája van. Az alapértelmezett **100 000** üzenet naptári havonta, hacsak az üzemeltető más plafont nem ad. Órás és napi korlátot is érvényesíthetünk. A plafon elérése után a további küldés elutasítható, amíg az ablak újra nem nyílik, vagy az üzemeltető nem emeli a limitet.

Felfüggesztett szervezet nem küldhet.

## Saját SES (BYO)

A saját AWS SES-fiók eladott opció, nem önkiszolgáló kapcsoló. Ön kéri; egy adminisztrátornak engedélyeznie kell. Ha engedélyezett, az Amazon Önt számlázza a SES-ért. Mennyiség, reputáció vagy szabály miatt saját SES-t is előírhatunk. Külön relé- vagy platformdíjat az üzemeltetővel kell megállapodni — ezek a feltételek automatikusan nem vonják.

## Elfogadható használat

Csak olyan levelet küldjön, amelynek küldésére joga van. Ne használja a szolgáltatást spamelésre, adathalászatra, kártevőre, jogellenes tartalomra vagy a tiltólisták megkerülésére. Visszapattanás vagy panasz után címeket tilthatunk, ismételt visszaélésnél a fiókot bezárhatjuk.

## Naplók

A működéshez és a hibakereséshez szükséges fiók-, bérlő-, domain- és API-kulcs-metaadatokat, valamint e-mail-eseménynaplókat tárolunk. A megőrzés a telepítés naplóbeállításait követi. Részletek az Adatvédelmi tájékoztatóban.

## Változások

A feltételek változásakor új dokumentumverzió és hatálybalépési dátum jelenik meg. Az önregisztrációnak az akkor hatályos verziót kell elfogadnia. Később a meglévő felhasználóktól is kérhetünk újabb elfogadást a konzol további használatához.

## Kapcsolat

Kérdéseivel a telepítés üzemeltetőjéhez forduljon. Lásd az Impresszumot.
`,
    privacy: `# Adatvédelmi tájékoztató

Ez a tájékoztató a használt RelayHorizon-telepítés által kezelt személyes és üzemeltetési adatokat írja le. A telepítés üzemeltetője a Nethorizon (lásd az Impresszumot).

## Mit tárolunk

- Fiókadatok: név, e-mail, jelszóhash, opcionális kép, nyelv, és — önregisztrációnál — az elfogadott feltételek verziója és időpontja
- Szervezet (bérlő) beállításai, domainek, DNS-ellenőrzés eredménye és API-kulcs-metaadatok (a titok hash-elve van)
- E-mail-eseménynaplók: címek, tárgy, állapot, szolgáltatói azonosítók és a kapcsolódó webhook-események
- Opcionális identitásszolgáltatói azonosítók, ha az üzemeltető bekapcsolta az egyszeri belépést

A levelek tartalmát nem adjuk el. Az üzenettörzset a kézbesítéshez dolgozzuk fel, és nem őrizzük ügyfélarchívumként azon túl, amit a naplók és a szolgáltató megtart.

## Miért tároljuk

Ezeket az adatokat a konzol működtetésére, a beléptetésre, a küldésre és a nyomon követésre, a kvóták és a visszaélési korlátok érvényesítésére, valamint a szolgáltatással kapcsolatos kapcsolattartásra használjuk.

## Megőrzés

Az e-mail-naplók megőrzése a telepítés naplóbeállításait követi (portál Naplók). A fiók- és bérlőadatok addig maradnak, amíg a szervezetet vagy a felhasználót törlik. A biztonsági mentés — ha be van kapcsolva — a mentési ütemezést követi.

## Továbbítás

A levelet az Amazon SES és/vagy a beállított SMTP-relé kapja meg a kézbesítéshez. Saját SES esetén az Amazon az Ön AWS-fiókján dolgozza fel a forgalmat. Adatot akkor adunk tovább, ha a jog megköveteli, vagy visszaélést vizsgálunk.

## Választási lehetőségek

A profilját a konzolban módosíthatja. A tulajdonos törölheti a szervezetét (Veszélyzóna). A portáladminisztrátorok a kezelt felhasználókat törölhetik. Egyéb kéréssel az üzemeltetőhöz forduljon (Impresszum).

## Kapcsolat

Használja a telepítés adminisztrátori vagy riasztási címét. Lásd az Impresszumot.
`,
    imprint: `# Impresszum

**Termék.** RelayHorizon — programozható kimenő e-mail.

**A telepítés üzemeltetője.** Nethorizon.

**Cégadatok — kitöltendő.** A székhely, a cégjegyzékszám és az adószám **ebben a verzióban nincs közzétéve**. Más oldalról ne következtessen címre.

**Kapcsolat.** Írjon a telepítésen beállított adminisztrátori vagy riasztási címre (a várólista, a jelszó-visszaállítás és az üzemeltetési levelek címe). Saját hosztolású üzemeltetőknek a saját jogi személyükre kell cserélniük ezt az Impresszumot, mielőtt ügyfeleknek kínálják a szolgáltatást.

**Forrás.** A RelayHorizon a FreeResendből származik. Az itt használt szolgáltatásért a telepítés üzemeltetője felel.
`,
  },
};
