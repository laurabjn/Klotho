import type {
  Mailer,
  PasswordResetEmail,
} from '../../domain/notifications/ports/mailer';

export interface BrevoSettings {
  apiKey: string;
  /** Sender address, verified in the Brevo account. */
  from: string;
  fromName: string;
  timeoutMs?: number;
}

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

/** Minimal escaping for the few values put in the HTML body. */
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Production mailer: Brevo's transactional API (a French provider, free up
 * to 300 emails a day). Errors never carry the API key nor the reset link.
 */
export class BrevoMailer implements Mailer {
  constructor(
    private readonly settings: BrevoSettings,
    private readonly send: typeof fetch = fetch,
  ) {}

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    const name = escapeHtml(email.firstName);
    const link = escapeHtml(email.resetUrl);
    const response = await this.send(ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': this.settings.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: this.settings.from, name: this.settings.fromName },
        to: [{ email: email.to, name: email.firstName }],
        subject: 'Réinitialise ton mot de passe Klotho',
        textContent: [
          `Bonjour ${email.firstName},`,
          '',
          'Tu as demandé à réinitialiser ton mot de passe Klotho.',
          `Ouvre ce lien depuis ton téléphone : ${email.resetUrl}`,
          '',
          'Si tu n’es pas à l’origine de cette demande, ignore simplement cet e-mail.',
        ].join('\n'),
        htmlContent: `<p>Bonjour ${name},</p>
<p>Tu as demandé à réinitialiser ton mot de passe Klotho.</p>
<p><a href="${link}">Choisir un nouveau mot de passe</a> (à ouvrir depuis ton téléphone)</p>
<p>Si tu n’es pas à l’origine de cette demande, ignore simplement cet e-mail.</p>`,
      }),
      signal: AbortSignal.timeout(this.settings.timeoutMs ?? 10_000),
    });
    if (!response.ok) {
      throw new Error(`Brevo refused the email (HTTP ${response.status})`);
    }
  }
}
