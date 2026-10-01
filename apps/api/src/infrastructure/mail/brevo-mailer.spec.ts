import { BrevoMailer } from './brevo-mailer';

const settings = {
  apiKey: 'brevo-key',
  from: 'contact@klotho.test',
  fromName: 'Klotho',
};
const email = {
  to: 'laura@example.com',
  firstName: 'Laura <3',
  resetUrl: 'klotho://reset-password?token=secret-token',
};

describe('BrevoMailer', () => {
  it('sends the reset email through the Brevo API', async () => {
    const send = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
      () => Promise.resolve(new Response('{}', { status: 201 })),
    );
    await new BrevoMailer(settings, send).sendPasswordReset(email);

    const [url, init] = send.mock.calls[0]!;
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init?.headers).toMatchObject({ 'api-key': 'brevo-key' });
    const body = JSON.parse(init!.body as string) as {
      sender: unknown;
      to: unknown;
      htmlContent: string;
      textContent: string;
    };
    expect(body.sender).toEqual({
      email: 'contact@klotho.test',
      name: 'Klotho',
    });
    expect(body.to).toEqual([{ email: 'laura@example.com', name: 'Laura <3' }]);
    expect(body.textContent).toContain(email.resetUrl);
    // The first name is escaped in the HTML.
    expect(body.htmlContent).toContain('Laura &lt;3');
  });

  it('sends the e-mail change confirmation to the new address', async () => {
    const send = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
      () => Promise.resolve(new Response('{}', { status: 201 })),
    );
    const confirmUrl = 'klotho://confirm-email?token=secret-token&x="1"';
    await new BrevoMailer(settings, send).sendEmailChangeConfirmation({
      to: 'new@example.com',
      firstName: 'Laura <3',
      confirmUrl,
    });

    const [, init] = send.mock.calls[0]!;
    const body = JSON.parse(init!.body as string) as {
      to: unknown;
      subject: string;
      htmlContent: string;
      textContent: string;
    };
    expect(body.to).toEqual([{ email: 'new@example.com', name: 'Laura <3' }]);
    expect(body.subject).toBe('Confirme ta nouvelle adresse e-mail Klotho');
    expect(body.textContent).toContain(confirmUrl);
    expect(body.htmlContent).toContain('Laura &lt;3');
    expect(body.htmlContent).toContain('x=&quot;1&quot;');
  });

  it('fails without revealing the key nor the link', async () => {
    const send = jest.fn(() =>
      Promise.resolve(new Response('{}', { status: 401 })),
    );
    const sending = new BrevoMailer(settings, send).sendPasswordReset(email);

    await expect(sending).rejects.toThrow('HTTP 401');
    await expect(sending).rejects.not.toThrow(/brevo-key|secret-token/);

    const confirming = new BrevoMailer(
      settings,
      send,
    ).sendEmailChangeConfirmation({
      to: 'new@example.com',
      firstName: 'Laura',
      confirmUrl: 'klotho://confirm-email?token=secret-token',
    });
    await expect(confirming).rejects.toThrow('HTTP 401');
    await expect(confirming).rejects.not.toThrow(/brevo-key|secret-token/);
  });
});
