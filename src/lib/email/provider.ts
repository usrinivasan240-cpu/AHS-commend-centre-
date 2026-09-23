export interface EmailSendOptions {
  to: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  html: string;
  text?: string;
  campaignId?: string;
  recipientId?: string;
  unsubscribeUrl?: string;
}

export interface EmailSendResult {
  success: boolean;
  providerMessageId?: string;
  status: "SENT" | "FAILED" | "QUEUED";
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
}

export interface EmailProvider {
  name: string;
  send(options: EmailSendOptions): Promise<EmailSendResult>;
}

export class MockProvider implements EmailProvider {
  name = "mock";
  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    await new Promise((r) => setTimeout(r, 50));
    return {
      success: true,
      providerMessageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "SENT",
    };
  }
}

export class ConsoleProvider implements EmailProvider {
  name = "console";
  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    console.log(`[EmailProvider:console] To=${options.to} Subject=${options.subject}`);
    return {
      success: true,
      providerMessageId: `console-${Date.now()}`,
      status: "SENT",
    };
  }
}

export class SmtpProvider implements EmailProvider {
  name = "smtp";
  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || "587");
    const user = process.env.EMAIL_USERNAME;
    const pass = process.env.EMAIL_PASSWORD;
    const secure = process.env.EMAIL_SECURE === "true" || port === 465;
    if (!host || !user || !pass) {
      return { success: false, status: "FAILED", errorCode: "CONFIG_MISSING", errorMessage: "SMTP not configured (EMAIL_HOST/USERNAME/PASSWORD missing)" };
    }
    try {
      const nodemailer: any = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      const htmlBody = options.html + (options.unsubscribeUrl ? `<br/><br/><small><a href="${options.unsubscribeUrl}">Unsubscribe</a></small>` : "");
      const info = await transporter.sendMail({
        from: `${options.fromName} <${options.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: htmlBody,
        text: options.text,
        headers: options.unsubscribeUrl ? { "List-Unsubscribe": `<${options.unsubscribeUrl}>` } : undefined,
      });
      return { success: true, providerMessageId: info.messageId as string, status: "SENT", raw: info };
    } catch (e: any) {
      return { success: false, status: "FAILED", errorCode: e.code || "SMTP_ERROR", errorMessage: e.message || String(e) };
    }
  }
}

export class GenericApiProvider implements EmailProvider {
  name = "api";
  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const apiUrl = process.env.EMAIL_API_URL;
    const apiKey = process.env.EMAIL_API_KEY;
    if (!apiUrl || !apiKey) {
      return { success: false, status: "FAILED", errorCode: "CONFIG_MISSING", errorMessage: "EMAIL_API_URL / EMAIL_API_KEY missing" };
    }
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          to: options.to,
          from: options.fromEmail,
          fromName: options.fromName,
          subject: options.subject,
          html: options.html,
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, status: "FAILED", errorCode: String(res.status), errorMessage: data.message || res.statusText };
      return { success: true, providerMessageId: data.id || data.messageId || `api-${Date.now()}`, status: "SENT", raw: data };
    } catch (e: any) {
      return { success: false, status: "FAILED", errorCode: "FETCH_ERROR", errorMessage: e.message };
    }
  }
}

export function getEmailProvider(): EmailProvider {
  const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase();
  const testMode = process.env.EMAIL_TEST_MODE === "true";
  if (testMode) return new ConsoleProvider();
  switch (provider) {
    case "smtp":
      return new SmtpProvider();
    case "console":
      return new ConsoleProvider();
    case "api":
      return new GenericApiProvider();
    case "mock":
    default:
      if (!provider || provider === "") return new MockProvider();
      return new MockProvider();
  }
}

export function getProviderStatus(): { provider: string; configured: boolean; testMode: boolean; fromName: string; fromEmail: string } {
  const provider = process.env.EMAIL_PROVIDER || "mock";
  const testMode = process.env.EMAIL_TEST_MODE === "true";
  const fromName = process.env.EMAIL_FROM_NAME || "AHS Global Services";
  const fromEmail = process.env.EMAIL_FROM_ADDRESS || "ahsglobalservices@gail.com";
  let configured = false;
  if (testMode) configured = true;
  else if (provider === "smtp") configured = Boolean(process.env.EMAIL_HOST && process.env.EMAIL_USERNAME && process.env.EMAIL_PASSWORD);
  else if (provider === "api") configured = Boolean(process.env.EMAIL_API_URL && process.env.EMAIL_API_KEY);
  else if (provider === "mock" || provider === "") configured = true;
  return { provider, configured, testMode, fromName, fromEmail };
}
