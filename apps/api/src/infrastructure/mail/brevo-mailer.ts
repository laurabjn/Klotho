import type {
  EmailChangeConfirmationEmail,
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

interface Message {
  to: string;
  firstName: string;
  subject: string;
  textContent: string;
  htmlContent: string;
}

/**
 * Production mailer: Brevo's transactional API (a French provider, free up
 * to 300 emails a day). Errors never carry the API key nor the links.
 */
export class BrevoMailer implements Mailer {
  constructor(
    private readonly settings: BrevoSettings,
    private readonly send: typeof fetch = fetch,
  ) {}

  sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    const name = escapeHtml(email.firstName);
    const link = escapeHtml(email.resetUrl);
    return this.deliver({
      to: email.to,
      firstName: email.firstName,
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
    });
  }

  sendEmailChangeConfirmation(
    email: EmailChangeConfirmationEmail,
  ): Promise<void> {
    const name = escapeHtml(email.firstName);
    const link = escapeHtml(email.confirmUrl);
    return this.deliver({
      to: email.to,
      firstName: email.firstName,
      subject: 'Confirme ta nouvelle adresse e-mail Klotho',
      textContent: [
        `Bonjour ${email.firstName},`,
        '',
        'Tu as demandé à utiliser cette adresse pour ton compte Klotho.',
        `Ouvre ce lien depuis ton téléphone pour la confirmer : ${email.confirmUrl}`,
        '',
        'Si tu n’es pas à l’origine de cette demande, ignore simplement cet e-mail : ton adresse ne changera pas.',
      ].join('\n'),
      htmlContent: `<p>Bonjour ${name},</p>
<p>Tu as demandé à utiliser cette adresse pour ton compte Klotho.</p>
<p><a href="${link}">Confirmer ma nouvelle adresse</a> (à ouvrir depuis ton téléphone)</p>
<p>Si tu n’es pas à l’origine de cette demande, ignore simplement cet e-mail : ton adresse ne changera pas.</p>`,
    });
  }

  private async deliver(message: Message): Promise<void> {
    const response = await this.send(ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': this.settings.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: this.settings.from, name: this.settings.fromName },
        to: [{ email: message.to, name: message.firstName }],
        subject: message.subject,
        textContent: message.textContent,
        htmlContent: message.htmlContent,
      }),
      signal: AbortSignal.timeout(this.settings.timeoutMs ?? 10_000),
    });
    if (!response.ok) {
      throw new Error(`Brevo refused the email (HTTP ${response.status})`);
    }
  }
}
