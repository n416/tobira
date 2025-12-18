import { Env } from '../types'

export async function sendEmail(env: Env, to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) {
    console.warn('[Mail Mock] API Key missing. Log only.');
    console.log(`To: ${to}`);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        // Updated to the custom domain
        from: 'tobira <noreply@tobiras.work>', 
        to: [to],
        subject: subject,
        html: html
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Mail Error]', err);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('[Mail Exception]', e);
    return false;
  }
}
