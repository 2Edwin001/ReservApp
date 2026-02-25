# ReservApp

Plataforma SaaS multi-tenant para gestión de reservas. Cada negocio tiene su propio panel y una página pública donde los clientes reservan online.

## Stack

- **Frontend**: React 18 + Vite 6 + Tailwind CSS 3 + React Router DOM 6
- **Backend**: Supabase (Auth + PostgreSQL + Storage + Edge Functions)
- **Email**: Resend via Supabase Edge Functions
- **Deploy**: Vercel (frontend) + Supabase (backend)
- **PWA**: vite-plugin-pwa (installable en móvil)

## Tipos de negocio soportados

| Tipo | Recurso | Capacidad |
|------|---------|-----------|
| Restaurante 🍽️ | Mesa | 1–20 personas |
| Estacionamiento 🅿️ | Puesto | 1 vehículo |
| Car Wash 🚗 | Bahía | 1 vehículo |
| Salón de belleza ✂️ | Silla | 1–8 personas |
| Cancha deportiva 🏆 | Cancha | 2–22 personas |
| Oficina / sala 🏢 | Sala | 1–50 personas |

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page pública |
| `/register` | Registro de nuevo negocio (2 pasos) |
| `/admin/login` | Login del panel admin |
| `/admin/onboarding` | Configuración inicial guiada (3 pasos) |
| `/admin/dashboard` | Dashboard con stats y reservas del día |
| `/admin/reservas` | Listado y gestión de reservas |
| `/admin/configuracion` | Configuración del negocio |
| `/admin/reportes` | Reportes y estadísticas |
| `/r/:slug` | Página pública de reservas del negocio |
| `/r/:slug/confirmacion` | Confirmación de reserva |

## Estructura del proyecto

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.jsx     # Sidebar + layout del panel
│   │   └── Toast.jsx           # Notificaciones + hook useToast
│   └── ProtectedRoute.jsx      # Guard de rutas privadas
├── hooks/
│   ├── useAuth.js              # Sesión con onAuthStateChange
│   └── useRestaurant.js        # Carga restaurant + settings del usuario autenticado
├── lib/
│   ├── supabase.js             # Cliente Supabase
│   └── businessTypes.js        # Labels, íconos y rangos de capacidad por tipo
├── pages/
│   ├── admin/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Onboarding.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Reservas.jsx
│   │   ├── Configuracion.jsx
│   │   └── Reportes.jsx
│   └── public/
│       ├── LandingPage.jsx
│       ├── ReservaPage.jsx     # Flujo 3 pasos: fecha → horario → datos
│       └── Confirmacion.jsx
└── App.jsx
```

## Base de datos (Supabase)

```sql
restaurants    -- id, owner_id, name, slug, business_type, logo_url
settings       -- restaurant_id, open_time, close_time, slot_interval,
               --   open_days, blocked_dates, requires_deposit, deposit_percentage
resources      -- restaurant_id, number, capacity, is_active
reservations   -- restaurant_id, table_id (FK→resources), date, time,
               --   client_name, client_email, client_phone, people, status, notes
business_types -- id, name, icon, unit_label, description
```

## Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RESEND_API_KEY=
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy

```bash
# Frontend — Vercel redespliega automáticamente en cada push a main
git push origin main

# Edge Function de email
supabase functions deploy send-email
supabase secrets set RESEND_API_KEY=<key>
```

## Flujo del cliente

1. Entra a `reservapp.space/r/mi-negocio`
2. Elige fecha disponible en el calendario
3. Selecciona horario (muestra recursos libres por turno: "Mesa 1 · Mesa 2")
4. Completa nombre, email, teléfono y cantidad de personas
5. Si el negocio requiere depósito, se muestra el % antes de confirmar
6. Se crea la reserva y se envía email de confirmación

## Flujo del negocio

1. Se registra en `/register` (credenciales + tipo de negocio)
2. Completa onboarding: horarios → recursos → link listo
3. Gestiona reservas desde `/admin/reservas`
4. Configura horarios, recursos, días bloqueados y depósito desde `/admin/configuracion`
