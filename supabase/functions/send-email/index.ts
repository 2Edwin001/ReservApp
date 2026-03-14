import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { type, reservation } = body

    console.log('[smart-endpoint] payload recibido:', JSON.stringify({
      type,
      to: reservation?.client_email,
      restaurant: reservation?.restaurant_name,
      has_api_key: !!Deno.env.get('RESEND_API_KEY'),
    }))

    // ── Confirmation email ────────────────────────────────────────────────────
    if (type === 'confirmation') {
      const sendResult = await resend.emails.send({
        from: 'ReservApp <reservas@reservapp.space>',
        to: [reservation.client_email],
        subject: `✅ Reserva confirmada en ${reservation.restaurant_name}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <tr>
    <td align="center" style="padding:32px 16px">

      <!-- Card -->
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%">

        <!-- Header -->
        <tr>
          <td bgcolor="#4f46e5" style="background-color:#4f46e5;padding:36px 32px 32px;text-align:center;border-radius:16px 16px 0 0">
            <div style="font-size:44px;line-height:1;margin-bottom:14px">✅</div>
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px">¡Reserva confirmada!</h1>
            <p style="color:rgba(255,255,255,0.70);margin:8px 0 0;font-size:14px">${reservation.restaurant_name}</p>
          </td>
        </tr>

        <!-- White body -->
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:0 0 16px 16px;padding:32px">

            <!-- Greeting -->
            <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6">
              Hola <strong style="color:#111827">${reservation.client_name}</strong>,
              tu reserva quedó confirmada. Guardá este resumen.
            </p>

            <!-- Code highlight -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
              <tr>
                <td bgcolor="#eef2ff" style="background-color:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:18px 16px;text-align:center">
                  <p style="color:#6366f1;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2.5px;margin:0 0 8px">Código de reserva</p>
                  <p style="color:#3730a3;font-size:30px;font-weight:700;letter-spacing:7px;margin:0;font-family:'Courier New',Courier,monospace">${reservation.code}</p>
                </td>
              </tr>
            </table>

            <!-- Details -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;border-spacing:0;margin-bottom:24px">
              <tr>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:13px 16px;color:#6b7280;font-size:13px;width:42%;border-bottom:1px solid #e2e8f0">📅 Fecha</td>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:13px 16px;font-weight:600;color:#111827;font-size:13px;border-bottom:1px solid #e2e8f0">${reservation.date}</td>
              </tr>
              <tr>
                <td style="padding:13px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e2e8f0">🕐 Hora</td>
                <td style="padding:13px 16px;font-weight:600;color:#111827;font-size:13px;border-bottom:1px solid #e2e8f0">${reservation.time}</td>
              </tr>
              <tr>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:13px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e2e8f0">👥 Personas</td>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:13px 16px;font-weight:600;color:#111827;font-size:13px;border-bottom:1px solid #e2e8f0">${reservation.people} ${Number(reservation.people) === 1 ? 'persona' : 'personas'}</td>
              </tr>
            </table>

            ${Number(reservation.deposit_percentage) > 0 || (reservation.requires_prepayment && reservation.prepayment_message) ? `
            <!-- Payment notice (unified) -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
              <tr>
                <td bgcolor="#fffbeb" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px">
                  <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 5px">💳 Información de pago</p>
                  ${Number(reservation.deposit_percentage) > 0 ? `<p style="color:#78350f;font-size:13px;margin:0 0 ${reservation.requires_prepayment && reservation.prepayment_message ? '8px' : '0'};line-height:1.5">Se requiere un depósito del <strong>${reservation.deposit_percentage}%</strong> para confirmar tu reserva.</p>` : ''}
                  ${reservation.requires_prepayment && reservation.prepayment_message ? `<p style="color:#78350f;font-size:13px;margin:0;line-height:1.5">${reservation.prepayment_message}</p>` : ''}
                </td>
              </tr>
            </table>` : ''}

            <!-- Closing message -->
            <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6">
              ¡Te esperamos! Si necesitás cancelar o modificar tu reserva,
              contactá directamente al negocio.
            </p>

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-top:1px solid #f3f4f6;padding-top:18px;text-align:center">
                  <p style="color:#d1d5db;font-size:12px;margin:0;line-height:1.6">
                    Enviado por <strong style="color:#6366f1">ReservApp</strong>
                    &nbsp;·&nbsp;
                    Si no realizaste esta reserva, ignorá este email.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td>
  </tr>
</table>
</body>
</html>
        `,
      })

      console.log('[smart-endpoint] respuesta Resend:', JSON.stringify(sendResult))

      if (sendResult.error) {
        console.error('[smart-endpoint] Resend error:', JSON.stringify(sendResult.error))
        return new Response(
          JSON.stringify({ ok: false, resend_error: sendResult.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[smart-endpoint] email enviado, id:', sendResult.data?.id)
    }

    // ── Admin notification ────────────────────────────────────────────────────
    if (type === 'admin_notification' && reservation.admin_email) {
      const adminResult = await resend.emails.send({
        from: 'ReservApp <reservas@reservapp.space>',
        to: [reservation.admin_email],
        subject: `🔔 Nueva reserva de ${reservation.client_name}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <tr>
    <td align="center" style="padding:32px 16px">

      <!-- Card -->
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%">

        <!-- Header -->
        <tr>
          <td bgcolor="#1e1b4b" style="background-color:#1e1b4b;padding:32px;text-align:center;border-radius:16px 16px 0 0">
            <div style="font-size:40px;line-height:1;margin-bottom:12px">🔔</div>
            <h1 style="color:#ffffff;margin:0;font-size:20px;font-weight:700">Nueva reserva recibida</h1>
            <p style="color:rgba(255,255,255,0.60);margin:8px 0 0;font-size:13px">${reservation.restaurant_name}</p>
          </td>
        </tr>

        <!-- White body -->
        <tr>
          <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:0 0 16px 16px;padding:28px 32px 32px">

            <!-- Section: Cliente -->
            <p style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px">Cliente</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;border-spacing:0;margin-bottom:20px">
              <tr>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:12px 16px;color:#6b7280;font-size:13px;width:38%;border-bottom:1px solid #e2e8f0">👤 Nombre</td>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:12px 16px;font-weight:600;color:#111827;font-size:13px;border-bottom:1px solid #e2e8f0">${reservation.client_name}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e2e8f0">📧 Email</td>
                <td style="padding:12px 16px;color:#111827;font-size:13px;border-bottom:1px solid #e2e8f0">${reservation.client_email}</td>
              </tr>
              <tr>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:12px 16px;color:#6b7280;font-size:13px">📱 Teléfono</td>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:12px 16px;color:#111827;font-size:13px">${reservation.client_phone ?? '—'}</td>
              </tr>
            </table>

            <!-- Section: Reserva -->
            <p style="color:#9ca3af;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px">Reserva</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:separate;border-spacing:0;margin-bottom:${reservation.notes ? '20px' : '24px'}">
              <tr>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:12px 16px;color:#6b7280;font-size:13px;width:38%;border-bottom:1px solid #e2e8f0">📅 Fecha</td>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:12px 16px;font-weight:600;color:#111827;font-size:13px;border-bottom:1px solid #e2e8f0">${reservation.date}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e2e8f0">🕐 Hora</td>
                <td style="padding:12px 16px;font-weight:600;color:#111827;font-size:13px;border-bottom:1px solid #e2e8f0">${reservation.time}</td>
              </tr>
              <tr>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:12px 16px;color:#6b7280;font-size:13px">👥 Personas</td>
                <td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:12px 16px;font-weight:600;color:#111827;font-size:13px">${reservation.people} ${Number(reservation.people) === 1 ? 'persona' : 'personas'}</td>
              </tr>
            </table>

            ${reservation.notes ? `
            <!-- Client note -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
              <tr>
                <td bgcolor="#fffbeb" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px">
                  <p style="color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 5px">📝 Nota del cliente</p>
                  <p style="color:#78350f;font-size:13px;margin:0;line-height:1.5">${reservation.notes}</p>
                </td>
              </tr>
            </table>` : ''}

            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-top:1px solid #f3f4f6;padding-top:18px;text-align:center">
                  <p style="color:#d1d5db;font-size:12px;margin:0">
                    <strong style="color:#6366f1">ReservApp</strong> · Sistema de reservas online
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td>
  </tr>
</table>
</body>
</html>
        `,
      })
      console.log('[smart-endpoint] admin notification:', JSON.stringify(adminResult))
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[smart-endpoint] excepción no controlada:', error?.message, error?.stack)
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
