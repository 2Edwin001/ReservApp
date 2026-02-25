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

    // ── Log 1: payload received ───────────────────────────────────────────────
    console.log('[smart-endpoint] payload recibido:', JSON.stringify({
      type,
      to: reservation?.client_email,
      restaurant: reservation?.restaurant_name,
      has_api_key: !!Deno.env.get('RESEND_API_KEY'),
    }))

    if (type === 'confirmation') {
      const sendResult = await resend.emails.send({
        from: 'ReservApp <reservas@reservapp.space>',
        to: [reservation.client_email],
        subject: `✅ Reserva confirmada en ${reservation.restaurant_name}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#f3f4f6;padding:24px 16px">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);border-radius:16px 16px 0 0;padding:36px 32px 32px;text-align:center">
              <div style="font-size:44px;line-height:1;margin-bottom:12px">✅</div>
              <h1 style="color:white;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px">¡Reserva confirmada!</h1>
              <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px">${reservation.restaurant_name}</p>
            </div>

            <!-- Body -->
            <div style="background:white;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6">
                Hola <strong>${reservation.client_name}</strong>, tu reserva quedó confirmada.
                Guardá este resumen:
              </p>

              <!-- Details -->
              <div style="background:#f9fafb;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse">
                  <tr style="border-bottom:1px solid #e5e7eb">
                    <td style="padding:13px 16px;color:#6b7280;font-size:13px;width:42%">📅 Fecha</td>
                    <td style="padding:13px 16px;font-weight:600;color:#111827;font-size:13px">${reservation.date}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #e5e7eb">
                    <td style="padding:13px 16px;color:#6b7280;font-size:13px">🕐 Hora</td>
                    <td style="padding:13px 16px;font-weight:600;color:#111827;font-size:13px">${reservation.time}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #e5e7eb">
                    <td style="padding:13px 16px;color:#6b7280;font-size:13px">👥 Personas</td>
                    <td style="padding:13px 16px;font-weight:600;color:#111827;font-size:13px">${reservation.people} ${Number(reservation.people) === 1 ? 'persona' : 'personas'}</td>
                  </tr>
                  <tr>
                    <td style="padding:13px 16px;color:#6b7280;font-size:13px">🔑 Código</td>
                    <td style="padding:13px 16px;font-weight:700;color:#6366f1;font-size:18px;letter-spacing:4px">${reservation.code}</td>
                  </tr>
                </table>
              </div>

              ${Number(reservation.deposit_percentage) > 0 ? `
              <!-- Deposit notice -->
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px">
                <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 6px">💳 Depósito requerido: ${reservation.deposit_percentage}%</p>
                <p style="color:#78350f;font-size:13px;margin:0;line-height:1.6">El negocio se pondrá en contacto contigo para coordinar el pago anticipado antes de tu reserva.</p>
              </div>` : ''}

              ${reservation.requires_prepayment && reservation.prepayment_message ? `
              <!-- Prepayment notice -->
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px;margin-bottom:24px">
                <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 6px">⚠️ Información de pago</p>
                <p style="color:#78350f;font-size:13px;margin:0;line-height:1.6">${reservation.prepayment_message}</p>
              </div>` : ''}

              <p style="color:#374151;font-size:14px;margin:0 0 28px;line-height:1.6">
                ¡Te esperamos! Si necesitás cancelar o modificar tu reserva,
                contactá directamente al negocio.
              </p>

              <!-- Footer -->
              <div style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center">
                <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6">
                  Enviado por <strong style="color:#6366f1">ReservApp</strong><br>
                  Si no realizaste esta reserva, ignorá este email.
                </p>
              </div>
            </div>

          </div>
        `,
      })

      // ── Log 2: Resend response ──────────────────────────────────────────────
      console.log('[smart-endpoint] respuesta Resend:', JSON.stringify(sendResult))

      // ── Log 3: Resend error inside response object ──────────────────────────
      if (sendResult.error) {
        console.error('[smart-endpoint] Resend error:', JSON.stringify(sendResult.error))
        return new Response(
          JSON.stringify({ ok: false, resend_error: sendResult.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[smart-endpoint] email enviado, id:', sendResult.data?.id)
    }

    if (type === 'admin_notification' && reservation.admin_email) {
      const adminResult = await resend.emails.send({
        from: 'ReservApp <reservas@reservapp.space>',
        to: [reservation.admin_email],
        subject: `🔔 Nueva reserva de ${reservation.client_name}`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#f3f4f6;padding:24px 16px">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);border-radius:16px 16px 0 0;padding:32px;text-align:center">
              <div style="font-size:40px;line-height:1;margin-bottom:10px">🔔</div>
              <h1 style="color:white;margin:0;font-size:20px;font-weight:700">Nueva reserva recibida</h1>
              <p style="color:rgba(255,255,255,0.65);margin:8px 0 0;font-size:13px">${reservation.restaurant_name}</p>
            </div>

            <!-- Body -->
            <div style="background:white;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

              <!-- Client info -->
              <p style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 10px">Cliente</p>
              <div style="background:#f9fafb;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:20px">
                <table style="width:100%;border-collapse:collapse">
                  <tr style="border-bottom:1px solid #e5e7eb">
                    <td style="padding:12px 16px;color:#6b7280;font-size:13px;width:42%">👤 Nombre</td>
                    <td style="padding:12px 16px;font-weight:600;color:#111827;font-size:13px">${reservation.client_name}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #e5e7eb">
                    <td style="padding:12px 16px;color:#6b7280;font-size:13px">📧 Email</td>
                    <td style="padding:12px 16px;color:#111827;font-size:13px">${reservation.client_email}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;color:#6b7280;font-size:13px">📱 Teléfono</td>
                    <td style="padding:12px 16px;color:#111827;font-size:13px">${reservation.client_phone ?? '—'}</td>
                  </tr>
                </table>
              </div>

              <!-- Reservation info -->
              <p style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 10px">Reserva</p>
              <div style="background:#f9fafb;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:24px">
                <table style="width:100%;border-collapse:collapse">
                  <tr style="border-bottom:1px solid #e5e7eb">
                    <td style="padding:12px 16px;color:#6b7280;font-size:13px;width:42%">📅 Fecha</td>
                    <td style="padding:12px 16px;font-weight:600;color:#111827;font-size:13px">${reservation.date}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #e5e7eb">
                    <td style="padding:12px 16px;color:#6b7280;font-size:13px">🕐 Hora</td>
                    <td style="padding:12px 16px;font-weight:600;color:#111827;font-size:13px">${reservation.time}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;color:#6b7280;font-size:13px">👥 Personas</td>
                    <td style="padding:12px 16px;font-weight:600;color:#111827;font-size:13px">${reservation.people} ${Number(reservation.people) === 1 ? 'persona' : 'personas'}</td>
                  </tr>
                </table>
              </div>

              ${reservation.notes ? `
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 16px;margin-bottom:24px">
                <p style="color:#92400e;font-size:12px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px">📝 Nota del cliente</p>
                <p style="color:#78350f;font-size:14px;margin:0">${reservation.notes}</p>
              </div>` : ''}

              <!-- Footer -->
              <div style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center">
                <p style="color:#9ca3af;font-size:12px;margin:0">
                  <strong style="color:#6366f1">ReservApp</strong> · Sistema de reservas online
                </p>
              </div>
            </div>

          </div>
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
