// =========================================
// netlify/functions/subscribe.js
// Captura el email del formulario de acceso anticipado.
// =========================================
//
// Funciona incluso sin configurar nada: Netlify Forms ya guarda
// los emails en Site → Forms. Esta función añade, opcionalmente,
// envío de email de bienvenida con Resend.
//
// Variables de entorno (opcionales):
//   RESEND_API_KEY   → re_... (dashboard.resend.com)
//   FROM_EMAIL       → "Discipline Society <hola@tudominio.com>"
//                      (el dominio debe estar verificado en Resend)
//   ADMIN_EMAIL      → tu@email.com  (para recibir notificación de nuevo lead)

const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  // Parse + validate
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'JSON inválido.' });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return json(400, { error: 'Email no válido.' });
  }

  // Si Resend no está configurado, hacemos no-op (Netlify Forms ya
  // capturó el email con el POST al form "early-access").
  const { RESEND_API_KEY, FROM_EMAIL, ADMIN_EMAIL } = process.env;
  if (!RESEND_API_KEY || !FROM_EMAIL) {
    return json(200, { ok: true, captured: true, notified: false });
  }

  try {
    const resend = new Resend(RESEND_API_KEY);

    // 1. Email de bienvenida al nuevo suscriptor
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Estás dentro.',
      html: welcomeHtml(),
      text: welcomeText(),
    });

    // 2. Notificación al admin (si está configurado)
    if (ADMIN_EMAIL) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `[DS] Nuevo lead · ${email}`,
        text: `Nuevo suscriptor al acceso anticipado:\n\n${email}\n\n— Discipline Society`,
      });
    }

    return json(200, { ok: true, captured: true, notified: true });
  } catch (err) {
    console.error('[subscribe]', err);
    // No rompemos el flujo: el email ya quedó en Netlify Forms.
    return json(200, { ok: true, captured: true, notified: false });
  }
};

// ---------- helpers ----------
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

function welcomeHtml() {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0908;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#f5f2ec;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0908;">
      <tr><td align="center" style="padding:48px 24px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr><td style="padding-bottom:32px;border-bottom:1px solid rgba(201,169,97,.25);">
            <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:2px;color:#f5f2ec;">
              DISCIPLINE <span style="color:#c9a961;font-style:italic;">/</span> SOCIETY
            </div>
          </td></tr>
          <tr><td style="padding:40px 0 8px;">
            <div style="font-size:11px;letter-spacing:3px;color:#c9a961;text-transform:uppercase;">— Acceso Anticipado —</div>
          </td></tr>
          <tr><td style="padding:8px 0 24px;">
            <h1 style="margin:0;font-family:Georgia,serif;font-size:42px;font-weight:400;line-height:1.05;color:#f5f2ec;">
              Estás <em style="color:#c9a961;">dentro.</em>
            </h1>
          </td></tr>
          <tr><td style="padding:0 0 16px;font-size:15px;line-height:1.7;color:#a8a39a;">
            No te vamos a escribir mucho. Solo cuando algo importe.
          </td></tr>
          <tr><td style="padding:0 0 16px;font-size:15px;line-height:1.7;color:#a8a39a;">
            Drops privados. Guías antes de que existan para el resto. Fórmulas y sistemas que solo van a ver quienes están en esta lista.
          </td></tr>
          <tr><td style="padding:0 0 32px;font-size:15px;line-height:1.7;color:#a8a39a;">
            Mientras tanto, empieza por lo único que puedes controlar hoy: los próximos 30 días.
          </td></tr>
          <tr><td style="padding:32px 0;border-top:1px solid rgba(201,169,97,.25);border-bottom:1px solid rgba(201,169,97,.25);">
            <div style="font-family:Georgia,serif;font-style:italic;font-size:16px;color:#c9a961;line-height:1.6;">
              "Mientras todos buscan aplausos, nosotros buscamos resultados."
            </div>
          </td></tr>
          <tr><td style="padding:32px 0 0;font-size:10px;letter-spacing:2px;color:#a8a39a;text-transform:uppercase;">
            Discipline Society · Miami · Barcelona
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function welcomeText() {
  return `DISCIPLINE / SOCIETY

Estás dentro.

No te vamos a escribir mucho. Solo cuando algo importe.

Drops privados, guías antes de que existan para el resto, fórmulas y sistemas que solo van a ver quienes están en esta lista.

Mientras tanto, empieza por lo único que puedes controlar hoy: los próximos 30 días.

"Mientras todos buscan aplausos, nosotros buscamos resultados."

— Discipline Society
Miami · Barcelona`;
}
