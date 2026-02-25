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
        subject: `Reserva confirmada — ${reservation.restaurant_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <h2 style="color:#6366f1">¡Tu reserva está confirmada! 🎉</h2>
            <p>Hola <strong>${reservation.client_name}</strong>,</p>
            <p>Tu reserva en <strong>${reservation.restaurant_name}</strong> ha sido confirmada.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px 0;color:#555">📅 Fecha</td>   <td><strong>${reservation.date}</strong></td></tr>
              <tr><td style="padding:8px 0;color:#555">🕐 Hora</td>    <td><strong>${reservation.time}</strong></td></tr>
              <tr><td style="padding:8px 0;color:#555">👥 Personas</td><td><strong>${reservation.people}</strong></td></tr>
              <tr><td style="padding:8px 0;color:#555">🔑 Código</td>  <td><strong style="letter-spacing:2px">${reservation.code}</strong></td></tr>
            </table>
            <p>¡Te esperamos!</p>
            <p style="font-size:12px;color:#999;margin-top:32px">Si no realizaste esta reserva, puedes ignorar este email.</p>
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
        subject: `Nueva reserva — ${reservation.client_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
            <h2 style="color:#6366f1">Nueva reserva recibida</h2>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px 0;color:#555">👤 Cliente</td> <td><strong>${reservation.client_name}</strong></td></tr>
              <tr><td style="padding:8px 0;color:#555">📧 Email</td>   <td>${reservation.client_email}</td></tr>
              <tr><td style="padding:8px 0;color:#555">📱 Teléfono</td><td>${reservation.client_phone ?? '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#555">📅 Fecha</td>   <td><strong>${reservation.date}</strong></td></tr>
              <tr><td style="padding:8px 0;color:#555">🕐 Hora</td>    <td><strong>${reservation.time}</strong></td></tr>
              <tr><td style="padding:8px 0;color:#555">👥 Personas</td><td><strong>${reservation.people}</strong></td></tr>
            </table>
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
