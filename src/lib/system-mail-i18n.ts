import { BRAND_NAME } from './brand';
import type { Locale } from './locale';

export type SystemMailCopy = {
  dateLocale: string;
  configTest: {
    subject: string;
    title: string;
    lead: string;
    bodyHtml: (via: string) => string;
    bodyText: (via: string) => string;
    footer: (via: string) => string;
  };
  passwordReset: {
    subject: string;
    title: string;
    lead: string;
    bodyHtml: string;
    ignore: string;
    bodyText: (link: string) => string;
    cta: string;
    footer: string;
  };
  waitlistNotify: {
    subject: (email: string) => string;
    title: string;
    lead: string;
    email: string;
    volume: string;
    provider: string;
    referral: string;
    signupTime: string;
    signupId: string;
    utm: string;
    unspecified: string;
    formatVolume: (volume?: number) => string;
    review: string;
    cta: string;
    footer: string;
  };
  waitlistWelcome: {
    subject: string;
    title: string;
    lead: string;
    thanks: string;
    expectTitle: string;
    expect1: string;
    expect2: string;
    expect3: string;
    whileYouWait: string;
    cta: string;
    footer: (signupId: string) => string;
  };
};

function volumeLabel(locale: string, unspecified: string) {
  return (volume?: number) => {
    if (volume === undefined || volume === null) return unspecified;
    return `${volume.toLocaleString(locale)} emails/month`;
  };
}

const en: SystemMailCopy = {
  dateLocale: 'en-GB',
  configTest: {
    subject: `${BRAND_NAME} configuration test`,
    title: 'Configuration test',
    lead: 'Portal Configuration reached this mailbox.',
    bodyHtml: (via) =>
      `<p style="margin:0 0 12px;">This is a test message from ${BRAND_NAME} portal Configuration.</p>`
      + `<p style="margin:0;">Transport: <strong>${via}</strong></p>`,
    bodyText: (via) =>
      `This is a test message from ${BRAND_NAME} portal Configuration. Transport: ${via}.`,
    footer: (via) => `Sent via ${via}.`,
  },
  passwordReset: {
    subject: `Reset your ${BRAND_NAME} password`,
    title: 'Reset your password',
    lead: 'This link expires in one hour.',
    bodyHtml:
      `<p style="margin:0 0 14px;">Use the button below to choose a new password for your ${BRAND_NAME} account.</p>`,
    ignore: 'If you did not ask for this, you can ignore the message.',
    bodyText: (link) =>
      `Use this link to choose a new password. It expires in one hour.\n\n${link}\n\n`
      + 'If you did not ask for this, you can ignore the message.',
    cta: 'Choose a new password',
    footer: `Password reset for your ${BRAND_NAME} operator account.`,
  },
  waitlistNotify: {
    subject: (email) => `New waitlist signup: ${email}`,
    title: 'New waitlist signup',
    lead: `Someone joined the ${BRAND_NAME} hosted waitlist.`,
    email: 'Email',
    volume: 'Expected volume',
    provider: 'Current provider',
    referral: 'Referral source',
    signupTime: 'Signup time',
    signupId: 'Signup ID',
    utm: 'UTM',
    unspecified: 'Not specified',
    formatVolume: volumeLabel('en-GB', 'Not specified'),
    review:
      'Review volume for tier planning, and reach out if they look like a high-volume prospect.',
    cta: 'View waitlist',
    footer: 'Sent because someone joined the hosted waitlist.',
  },
  waitlistWelcome: {
    subject: `You are on the ${BRAND_NAME} waitlist`,
    title: 'You are on the waitlist',
    lead: 'We will notify you when the hosted service is ready.',
    thanks: `Thanks for joining the ${BRAND_NAME} hosted waitlist. You are in line for early access to the managed outbound email service.`,
    expectTitle: 'What to expect',
    expect1: 'Lower cost than many premium transactional providers',
    expect2: 'We run the infrastructure; you keep the Resend-compatible API',
    expect3: 'Point RESEND_BASE_URL at your instance when it is live',
    whileYouWait:
      'While you wait, you can try the open-source self-hosted build on GitHub.',
    cta: 'Explore self-hosted',
    footer: (signupId) =>
      `You are receiving this because you joined the waitlist. Signup ID: ${signupId}`,
  },
};

const de: SystemMailCopy = {
  dateLocale: 'de-DE',
  configTest: {
    subject: `${BRAND_NAME}-Konfigurationstest`,
    title: 'Konfigurationstest',
    lead: 'Die Portal-Konfiguration hat dieses Postfach erreicht.',
    bodyHtml: (via) =>
      `<p style="margin:0 0 12px;">Dies ist eine Testnachricht aus der ${BRAND_NAME}-Portal-Konfiguration.</p>`
      + `<p style="margin:0;">Transport: <strong>${via}</strong></p>`,
    bodyText: (via) =>
      `Dies ist eine Testnachricht aus der ${BRAND_NAME}-Portal-Konfiguration. Transport: ${via}.`,
    footer: (via) => `Gesendet über ${via}.`,
  },
  passwordReset: {
    subject: `${BRAND_NAME}-Passwort zurücksetzen`,
    title: 'Passwort zurücksetzen',
    lead: 'Dieser Link läuft in einer Stunde ab.',
    bodyHtml:
      `<p style="margin:0 0 14px;">Mit der Schaltfläche unten wählen Sie ein neues Passwort für Ihr ${BRAND_NAME}-Konto.</p>`,
    ignore: 'Wenn Sie das nicht angefordert haben, können Sie die Nachricht ignorieren.',
    bodyText: (link) =>
      `Über diesen Link wählen Sie ein neues Passwort. Er läuft in einer Stunde ab.\n\n${link}\n\n`
      + 'Wenn Sie das nicht angefordert haben, können Sie die Nachricht ignorieren.',
    cta: 'Neues Passwort wählen',
    footer: `Passwort-Reset für Ihr ${BRAND_NAME}-Betreiberkonto.`,
  },
  waitlistNotify: {
    subject: (email) => `Neue Wartelisten-Anmeldung: ${email}`,
    title: 'Neue Wartelisten-Anmeldung',
    lead: `Jemand hat sich in die gehostete ${BRAND_NAME}-Warteliste eingetragen.`,
    email: 'E-Mail',
    volume: 'Erwartetes Volumen',
    provider: 'Aktueller Anbieter',
    referral: 'Herkunft',
    signupTime: 'Anmeldezeit',
    signupId: 'Anmelde-ID',
    utm: 'UTM',
    unspecified: 'Nicht angegeben',
    formatVolume: (volume) => {
      if (volume === undefined || volume === null) return 'Nicht angegeben';
      return `${volume.toLocaleString('de-DE')} E-Mails/Monat`;
    },
    review:
      'Volumen für die Tarifplanung prüfen und bei hohem Bedarf nachfassen.',
    cta: 'Warteliste ansehen',
    footer: 'Gesendet, weil sich jemand in die gehostete Warteliste eingetragen hat.',
  },
  waitlistWelcome: {
    subject: `Sie stehen auf der ${BRAND_NAME}-Warteliste`,
    title: 'Sie stehen auf der Warteliste',
    lead: 'Wir benachrichtigen Sie, wenn der gehostete Dienst bereit ist.',
    thanks:
      `Danke für die Anmeldung zur gehosteten ${BRAND_NAME}-Warteliste. Sie sind in der Reihe für den frühen Zugang zum verwalteten Versanddienst.`,
    expectTitle: 'Was Sie erwarten können',
    expect1: 'Günstiger als viele Premium-Transaktionsanbieter',
    expect2: 'Wir betreiben die Infrastruktur; Sie behalten die Resend-kompatible API',
    expect3: 'Zeigen Sie RESEND_BASE_URL auf Ihre Instanz, sobald sie live ist',
    whileYouWait:
      'Bis dahin können Sie den Open-Source-Selbsthost-Build auf GitHub ausprobieren.',
    cta: 'Selbsthost ansehen',
    footer: (signupId) =>
      `Sie erhalten diese Nachricht, weil Sie sich in die Warteliste eingetragen haben. Anmelde-ID: ${signupId}`,
  },
};

const hu: SystemMailCopy = {
  dateLocale: 'hu-HU',
  configTest: {
    subject: `${BRAND_NAME} konfigurációs teszt`,
    title: 'Konfigurációs teszt',
    lead: 'A portál konfigurációja elérte ezt a postafiókot.',
    bodyHtml: (via) =>
      `<p style="margin:0 0 12px;">Ez egy tesztüzenet a ${BRAND_NAME} portál Konfigurációjából.</p>`
      + `<p style="margin:0;">Szállítás: <strong>${via}</strong></p>`,
    bodyText: (via) =>
      `Ez egy tesztüzenet a ${BRAND_NAME} portál Konfigurációjából. Szállítás: ${via}.`,
    footer: (via) => `Küldve: ${via}.`,
  },
  passwordReset: {
    subject: `${BRAND_NAME} jelszó visszaállítása`,
    title: 'Jelszó visszaállítása',
    lead: 'Ez a link egy óra múlva lejár.',
    bodyHtml:
      `<p style="margin:0 0 14px;">Az alábbi gombbal új jelszót adhat meg a ${BRAND_NAME}-fiókjához.</p>`,
    ignore: 'Ha nem Ön kérte, hagyja figyelmen kívül az üzenetet.',
    bodyText: (link) =>
      `Ezen a linken új jelszót adhat meg. Egy óra múlva lejár.\n\n${link}\n\n`
      + 'Ha nem Ön kérte, hagyja figyelmen kívül az üzenetet.',
    cta: 'Új jelszó megadása',
    footer: `Jelszó-visszaállítás a ${BRAND_NAME} operátori fiókjához.`,
  },
  waitlistNotify: {
    subject: (email) => `Új várólista-jelentkezés: ${email}`,
    title: 'Új várólista-jelentkezés',
    lead: `Valaki feliratkozott a ${BRAND_NAME} hosztolt várólistájára.`,
    email: 'E-mail',
    volume: 'Várható volumen',
    provider: 'Jelenlegi szolgáltató',
    referral: 'Forrás',
    signupTime: 'Jelentkezés ideje',
    signupId: 'Jelentkezés azonosítója',
    utm: 'UTM',
    unspecified: 'Nincs megadva',
    formatVolume: (volume) => {
      if (volume === undefined || volume === null) return 'Nincs megadva';
      return `${volume.toLocaleString('hu-HU')} e-mail/hó`;
    },
    review:
      'Ellenőrizze a volument a csomagtervezéshez, és lépjen kapcsolatba, ha nagy forgalmú érdeklődő.',
    cta: 'Várólista megnyitása',
    footer: 'Azért ment, mert valaki feliratkozott a hosztolt várólistára.',
  },
  waitlistWelcome: {
    subject: `Felkerült a ${BRAND_NAME} várólistájára`,
    title: 'Felkerült a várólistára',
    lead: 'Értesítjük, amikor a hosztolt szolgáltatás elkészül.',
    thanks:
      `Köszönjük, hogy feliratkozott a ${BRAND_NAME} hosztolt várólistájára. Sorban áll a kezelt kimenő e-mail szolgáltatás korai hozzáféréséért.`,
    expectTitle: 'Mire számíthat',
    expect1: 'Sok prémium tranzakciós szolgáltatónál kedvezőbb költség',
    expect2: 'Mi üzemeltetjük az infrastruktúrát; Ön megtartja a Resend-kompatibilis API-t',
    expect3: 'Ha él a példánya, mutassa a RESEND_BASE_URL-t arra',
    whileYouWait:
      'Addig is kipróbálhatja a nyílt forráskódú, saját hosztolású változatot a GitHubon.',
    cta: 'Saját hoszt felfedezése',
    footer: (signupId) =>
      `Azért kapja ezt, mert feliratkozott a várólistára. Jelentkezés azonosítója: ${signupId}`,
  },
};

const catalog: Record<Locale, SystemMailCopy> = { en, de, hu };

export function systemMailCopy(locale: Locale): SystemMailCopy {
  return catalog[locale] || catalog.en;
}
