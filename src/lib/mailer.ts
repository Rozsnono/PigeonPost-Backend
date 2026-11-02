import nodemailer from 'nodemailer';

/**
 * Email küldés SMTP-n keresztül. Konfiguráció (környezeti változók):
 * SMTP_HOST, SMTP_PORT (alap 587), SMTP_USER, SMTP_PASS, MAIL_FROM (pl. "PigeonPost <noreply@pelda.hu>").
 * Ha az SMTP nincs beállítva, a küldés hibával (false) tér vissza és naplózza – nem történik néma kudarc.
 */
export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  if (!isMailConfigured()) {
    console.error('[mailer] SMTP_HOST/MAIL_FROM nincs beállítva – email nem küldhető.');
    return false;
  }
  try {
    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transporter.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
    return true;
  } catch (error) {
    console.error('[mailer] Email küldése sikertelen:', error instanceof Error ? error.message : error);
    return false;
  }
}
