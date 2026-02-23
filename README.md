# ReservApp

Sistema de reservas online para restaurantes. Incluye un panel de administración para gestionar el restaurante y una página pública donde los clientes pueden hacer reservas en 3 pasos.

## Stack

- **Frontend**: React 18 + Vite 6 + Tailwind CSS 3 + React Router DOM 6
- **Backend**: Supabase (Auth + PostgreSQL + Edge Functions)
- **Email**: Resend (vía Supabase Edge Function)
- **Iconos**: Lucide React
- **Fechas**: date-fns

## Estructura del proyecto

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.jsx   # Sidebar compartido (todas las rutas admin)
│   │   └── Toast.jsx         # Componente de notificaciones + useToast hook
│   └── ProtectedRoute.jsx    # Guard de rutas privadas
├── hooks/
│   ├── useAuth.js            # Sesión activa con onAuthStateChange
│   └── useRestaurant.js      # Carga restaurant + settings del usuario autenticado
├── lib/
│   └── supabase.js           # Cliente de Supabase
├── pages/
│   ├── admin/
│   │   ├── Login.jsx         # Inicio de sesión
│   │   ├── Dashboard.jsx     # Estadísticas y reservas del día
│   │   ├── Reservas.jsx      # Listado con filtros y acciones
│   │   └── Configuracion.jsx # Ajustes del restaurante (4 secciones)
│   └── public/
│       ├── ReservaPage.jsx   # Flujo de reserva en 3 pasos
│       └── Confirmacion.jsx  # Página de confirmación post-reserva
└── App.jsx                   # Rutas de la aplicación
supabase/
└── functions/
    └── send-email/
        └── index.ts          # Edge Function — envío de emails con Resend
```

## Rutas

| Ruta | Descripción |
|---|---|
| `/admin/login` | Inicio de sesión |
| `/admin/dashboard` | Panel principal con estadísticas |
| `/admin/reservas` | Gestión de reservas |
| `/admin/configuracion` | Configuración del restaurante |
| `/r/:slug` | Página pública de reservas |
| `/r/:slug/confirmacion` | Confirmación de reserva |

## Base de datos (Supabase)

| Tabla | Columnas principales |
|---|---|
| `restaurants` | `id`, `user_id`, `name`, `slug` |
| `settings` | `restaurant_id`, `open_time`, `close_time`, `slot_interval`, `open_days`, `blocked_dates` |
| `tables` | `restaurant_id`, `number`, `capacity`, `is_active` |
| `reservations` | `restaurant_id`, `table_id`, `date`, `time`, `client_name`, `client_email`, `client_phone`, `people`, `status` |

> `open_days` usa el convenio JS: `0` = Domingo, `1` = Lunes … `6` = Sábado.
> `status` puede ser: `confirmed`, `completed`, `cancelled`.

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de variables de entorno
cp .env.example .env
```

Editar `.env` con las credenciales de tu proyecto:

```env
VITE_SUPABASE_URL=https://<proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Desarrollo

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Build de producción

```bash
npm run build
npm run preview   # previsualizar el build
```

## Edge Function (emails)

La función `send-email` se encarga de enviar el email de confirmación al cliente usando Resend. Está deployada en Supabase como `smart-endpoint`.

Para actualizarla, pega el contenido de `supabase/functions/send-email/index.ts` en el editor de la función dentro del Dashboard de Supabase y configura el secret:

```
RESEND_API_KEY=<tu-api-key>
```

> **Nota**: `onboarding@resend.dev` solo entrega emails a la cuenta del propietario de Resend. Para enviar a cualquier destinatario es necesario verificar un dominio propio en el panel de Resend.

## Panel de administración

1. Crear un usuario en Supabase Authentication (email + contraseña).
2. Acceder a `/admin/login`.
3. En **Configuración** completar los datos del restaurante antes de compartir el enlace público.
4. El enlace público tiene el formato `/r/<slug>`.
