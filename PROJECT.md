# Sistema de Turnos — Documentación del Proyecto

> Última actualización: 17 de junio de 2026  
> Estado: MVP completo — **desplegado en producción** ✓

---

## Índice

1. [Descripción general](#1-descripción-general)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura y pantallas](#3-arquitectura-y-pantallas)
4. [Estructura de archivos](#4-estructura-de-archivos)
5. [Base de datos — Supabase](#5-base-de-datos--supabase)
6. [Variables de entorno](#6-variables-de-entorno)
7. [Credenciales y accesos](#7-credenciales-y-accesos)
8. [Lo que está implementado](#8-lo-que-está-implementado)
9. [Pendientes del roadmap](#9-pendientes-del-roadmap)
10. [Deploy a Vercel](#10-deploy-a-vercel)
11. [Operación diaria](#11-operación-diaria)

---

## 1. Descripción general

Sistema de gestión de turnos digitales con tres puntos de acceso:

| Pantalla | Dispositivo | URL |
|----------|------------|-----|
| **Kiosco** | Tablet en mostrador | `/kiosk` |
| **Display** | TV en sala de espera | `/display` |
| **Móvil del usuario** | Celular personal (vía QR) | `/ticket/[token]` |
| **Panel del operador** | PC / tablet del staff | `/admin` |

**Flujo principal:**
```
Usuario toca kiosco → elige tipo de atención → recibe número + QR
  ↓ escanea QR
Móvil muestra posición en cola en tiempo real
  ↓ cuando Admin llama siguiente turno
Display TV se actualiza → Móvil muestra "¡Es tu turno!" → Notificación push
```

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.9 |
| Lenguaje | TypeScript | — |
| Estilos | Tailwind CSS | — |
| Base de datos | Supabase (PostgreSQL) | — |
| Realtime | Supabase Realtime (WebSocket) | — |
| Auth | Supabase Auth (email/password) | — |
| Cliente Supabase | @supabase/supabase-js | 2.108.2 |
| SSR Auth | @supabase/ssr | 0.12.0 |
| Notificaciones push | web-push (VAPID) | 3.6.7 |
| QR codes | qrcode.react | — |
| Deploy | Vercel (free tier) | — |
| DB hosting | Supabase (free tier) | — |

---

## 3. Arquitectura y pantallas

### Kiosco `/kiosk`
- Server Component carga las 4 colas desde Supabase
- Client Component maneja selección → Server Action crea ticket en DB
- Muestra número grande + QR apuntando a `/ticket/[token]`
- Auto-reset a los 30 segundos

### Display `/display`
- Server Component carga estado inicial
- Client Component suscrito a Supabase Realtime (`queues` + `tickets`)
- Animación de highlight 3s cuando cambia el turno en atención
- Números con `clamp()` para ser legibles a varios metros en TV

### Móvil `/ticket/[token]`
- Server Component carga ticket por UUID token
- Client Component suscrito a Realtime de su cola específica
- Muestra: número propio, turno actual, cuántos faltan, barra de progreso, tiempo estimado
- Botón "Activar alertas" → Service Worker + Web Push
- Estados: `waiting` / `called` / `attended` / `cancelled`
- Loading skeleton automático via `loading.tsx`

### Admin `/admin`
- Protegido con Supabase Auth (email/password)
- Selector de cola a atender
- Botón "Llamar siguiente" → llama función SQL `call_next_ticket()` + dispara push a próximos 3
- Botones secundarios: "Reiterar llamado" / "Marcar ausente"
- Stats del día: atendidos y en espera
- Botón "Reiniciar turnos del día" con confirmación

### Notificaciones push
- Service Worker en `/sw.js` (scope global)
- VAPID keys en variables de entorno
- Usuario suscribe desde móvil → `push_sub` guardado en `tickets.push_sub`
- Admin llama turno → server action envía Web Push a tokens de los próximos 3 en espera
- Funciona en Android Chrome directamente. En iOS requiere Safari + "Añadir al inicio" (iOS 16.4+)

---

## 4. Estructura de archivos

```
turnos-app/
├── public/
│   ├── sw.js                          # Service Worker (Web Push)
│   ├── manifest.json                  # PWA manifest
│   └── icons/
│       ├── icon-192.png               # ⚠️ PENDIENTE — placeholder vacío
│       └── icon-512.png               # ⚠️ PENDIENTE — placeholder vacío
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout + meta tags PWA
│   │   ├── page.tsx                   # Hub de navegación (dev)
│   │   ├── globals.css
│   │   ├── kiosk/
│   │   │   ├── page.tsx               # Server Component
│   │   │   ├── KioskClient.tsx        # Client Component
│   │   │   └── actions.ts             # Server Action: createTicket()
│   │   ├── display/
│   │   │   ├── page.tsx               # Server Component
│   │   │   └── DisplayClient.tsx      # Client Component + Realtime
│   │   ├── ticket/[token]/
│   │   │   ├── page.tsx               # Server Component
│   │   │   ├── TicketClient.tsx       # Client Component + Realtime
│   │   │   ├── loading.tsx            # Skeleton de carga
│   │   │   └── actions.ts             # cancelTicket() / savePushSubscription()
│   │   ├── admin/
│   │   │   ├── page.tsx               # Verifica auth → Login o Panel
│   │   │   ├── LoginForm.tsx          # Formulario email/password
│   │   │   ├── AdminClient.tsx        # Panel principal + Realtime
│   │   │   ├── ResetButton.tsx        # Botón reset con confirmación
│   │   │   └── actions.ts             # login/logout/callNext/markAbsent/reset
│   │   └── api/
│   │       └── notify/                # ⚠️ VACÍO — reservado para webhook futuro
│   │
│   ├── components/
│   │   ├── QRCodeDisplay.tsx          # Wrapper client de qrcode.react
│   │   └── PushSubscriber.tsx         # Botón "Activar alertas" + SW registration
│   │
│   ├── lib/
│   │   ├── supabase.ts                # Cliente browser (anon) + cliente admin (service role)
│   │   ├── supabase-server.ts         # Cliente SSR con cookies (para auth)
│   │   └── push.ts                    # sendPushToTokens() — servidor only
│   │
│   └── types/
│       └── index.ts                   # Queue, Ticket, TicketStatus, PushSubscriptionJSON
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql     # Tablas, índices, RLS, funciones, seed
│       └── 002_reset_fn.sql           # reset_daily_queues()
│
├── .env.local                         # Variables locales (no commitear)
├── .env.example                       # Template de variables (sí commitear)
└── PROJECT.md                         # Este archivo
```

---

## 5. Base de datos — Supabase

### Proyecto

| Campo | Valor |
|-------|-------|
| Nombre | `turnos-demo` |
| Project ID | `bqvgsloqmaywnmtvlavz` |
| Región | `sa-east-1` (São Paulo) |
| URL | `https://bqvgsloqmaywnmtvlavz.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/bqvgsloqmaywnmtvlavz |
| Organización | `wrbc` (`douxokwnktqurfxousqg`) |
| Plan | Free |

### Tablas

#### `queues`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | Identificador |
| `name` | text | Nombre de la cola (Caja, Consultas, etc.) |
| `prefix` | char(1) | Prefijo del turno (A, B, C, D) |
| `icon` | text | Emoji de la cola |
| `current_serving` | int | Número actualmente en atención |
| `is_active` | boolean | Si la cola está disponible |
| `created_at` | timestamptz | — |

#### `tickets`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | Identificador interno |
| `token` | uuid UNIQUE | Token público (en la URL del móvil) |
| `queue_id` | uuid FK | Cola a la que pertenece |
| `number` | int | Número de turno |
| `status` | text | `waiting` / `called` / `attended` / `cancelled` |
| `push_sub` | jsonb | Suscripción Web Push del celular del usuario |
| `created_at` | timestamptz | Cuándo se tomó el turno |
| `called_at` | timestamptz | Cuándo fue llamado |

### Funciones SQL

| Función | Descripción |
|---------|-------------|
| `next_ticket_number(q_id)` | Retorna el siguiente número disponible hoy para esa cola (atómica) |
| `call_next_ticket(q_id)` | Llama el siguiente waiting, actualiza `current_serving`, retorna próximos 3 tokens |
| `reset_daily_queues()` | Cancela todos los tickets pendientes y pone `current_serving = 0` en todas las colas |

### Políticas RLS

| Tabla | Política | Acción |
|-------|---------|--------|
| `queues` | `queues_public_read` | SELECT para todos |
| `tickets` | `tickets_public_read` | SELECT para todos |
| `tickets` | `tickets_public_insert` | INSERT para todos (kiosco sin auth) |
| `tickets` | `tickets_public_update` | UPDATE para todos (cancelar turno) |

### Realtime habilitado en
- Tabla `queues` — para actualizar display y móvil cuando cambia `current_serving`
- Tabla `tickets` — para actualizar conteos de espera

### Migraciones aplicadas
| Versión | Nombre |
|---------|--------|
| 20260616202507 | initial_schema |
| 20260616224458 | reset_daily_queues |

---

## 6. Variables de entorno

### `.env.local` (desarrollo local — NO commitear)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bqvgsloqmaywnmtvlavz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Web Push VAPID
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BJOFMFOWmhd2AVYT_PZNNCXgUKMeESVAf3khLjhhQd7CdG0IgjbqusJsazHnyxF0QVPNulpVgYgtuFG8D4fxs3E
VAPID_PRIVATE_KEY=E3Z3gvy1IBTsFc_6UlKvZVbtwmUcGDYgAv-2CTJZ5uY
VAPID_EMAIL=mailto:amceesystems@gmail.com
```

### Variables requeridas en Vercel (producción)
Las mismas 6 variables deben cargarse en:
**Vercel Dashboard → turnos-app → Settings → Environment Variables**

| Variable | Visibilidad |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (cliente + servidor) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (cliente + servidor) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — **nunca exponer al cliente** |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public (cliente + servidor) |
| `VAPID_PRIVATE_KEY` | Server only — **nunca exponer al cliente** |
| `VAPID_EMAIL` | Server only |

---

## 7. Credenciales y accesos

### Supabase Auth — usuario del operador

| Campo | Valor |
|-------|-------|
| Email | `admin@turnos.com` |
| Contraseña | `turnos2024!` |
| Rol | Usuario autenticado (staff) |

> Para crear más operadores: Supabase Dashboard → Authentication → Users → Add user

### Dónde encontrar las keys de Supabase
1. https://supabase.com/dashboard/project/bqvgsloqmaywnmtvlavz/settings/api
2. `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. `anon / public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. `service_role` (clic en Reveal) → `SUPABASE_SERVICE_ROLE_KEY`

### VAPID Keys (Web Push)
Las keys ya están generadas y en `.env.local`. **No regenerar** — si se cambian, todas las suscripciones push existentes quedan inválidas.

---

## 8. Lo que está implementado

### Fase 0 — Setup ✅
- Proyecto Next.js 16 con TypeScript, Tailwind CSS, App Router
- Dependencias: `@supabase/supabase-js`, `@supabase/ssr`, `qrcode.react`, `web-push`
- VAPID keys generadas
- Estructura de carpetas completa
- Proyecto Supabase creado en sa-east-1

### Fase 1 — Base de datos ✅
- Tablas `queues` y `tickets` con constraints e índices
- RLS habilitado con 4 políticas
- Funciones SQL: `next_ticket_number`, `call_next_ticket`, `reset_daily_queues`
- Realtime habilitado en ambas tablas
- Datos semilla: 4 colas (Caja A, Consultas B, Retiro C, Soporte D)

### Fase 2 — Kiosco `/kiosk` ✅
- Selección de cola con 4 botones táctiles grandes
- Server Action `createTicket()` — atómica, sin duplicados de número
- Confirmación con número grande + QR generado client-side
- Auto-reset a 30 segundos
- Responsive para tablet vertical con `h-screen` y tamaños `clamp()`
- Estado de carga con overlay spinner
- Colas inactivas mostradas como deshabilitadas

### Fase 3 — Display TV `/display` ✅
- Carga inicial server-side, actualizaciones vía Supabase Realtime
- Grid dinámico según cantidad de colas activas
- Números con `clamp(4rem, 10vw, 9rem)` — visibles desde varios metros
- Highlight animado 3 segundos al cambiar turno
- Reloj en tiempo real sin hydration mismatch
- Sección "Próximos en espera" por cola
- `h-screen overflow-hidden` para TVs sin scrollbar

### Fase 4 — Vista móvil `/ticket/[token]` ✅
- Carga por UUID token (campo público, actúa como secreto)
- Realtime suscrito a la cola específica del ticket
- Posición en cola: `currentServing`, `waitingAhead`, estimación `~X min`
- Barra de progreso con dots visuales
- Pantalla "¡Es tu turno!" con animación cuando `current_serving === number`
- Estados: waiting / called / attended / cancelled con pantallas propias
- Cancelar turno desde el móvil
- Loading skeleton automático (`loading.tsx`)

### Fase 5 — Admin `/admin` ✅
- Auth con Supabase Auth + cookies SSR (`@supabase/ssr`)
- Login form con `useActionState`
- Selector de cola a atender
- Botón "Llamar siguiente" → `call_next_ticket()` SQL
- Botón "Reiterar llamado" (visual, resalta el número actual)
- Botón "Marcar ausente" → cancela llamado actual + llama siguiente
- Stats en tiempo real: atendidos hoy / en espera
- Botón "Reiniciar turnos del día" con modal de confirmación
- Realtime para ver cambios de otras ventanillas

### Fase 6 — PWA + Notificaciones Push ✅
- Service Worker en `/sw.js` (scope global)
- `manifest.json` con nombre, iconos, colores, orientación
- Componente `PushSubscriber` — registra SW, pide permiso, suscribe, guarda en DB
- `savePushSubscription()` guarda `PushSubscriptionJSON` en `tickets.push_sub`
- `sendPushToTokens()` envía Web Push vía VAPID a los próximos 3 tickets
- Al llamar siguiente turno en admin → push automático a los próximos en espera
- Manejo de suscripciones expiradas (HTTP 410/404 → limpia el campo)
- Notificación abre `/ticket/[token]` al tocarla

### Fase 7 — Polish ✅
- Kiosco responsive tablet: `h-screen`, botones con `clamp()`, overlay de carga
- Display TV: números viewport-relative, header compacto, `h-screen`
- Loading skeleton del móvil con animación `animate-pulse`
- Botón reset diario con modal de confirmación en admin
- Meta tags PWA: `appleWebApp`, `mobile-web-app-capable`, `viewport`
- `apple-touch-icon` para guardado en Home Screen iOS

---

## 9. Pendientes del roadmap

### Críticos para producción (antes del deploy o inmediatamente después)

| # | Tarea | Detalle |
|---|-------|---------|
| P1 | **Íconos PWA reales** | Crear `public/icons/icon-192.png` y `icon-512.png`. Sin ellos la PWA no instala bien en iOS/Android. Herramienta: [favicon.io](https://favicon.io) o Canva → exportar 512×512 PNG |
| P2 | **Deploy a Vercel** | Ver sección 10 |
| P3 | **Configurar URL de producción en VAPID** | El campo `VAPID_EMAIL` ya es correcto. Verificar que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` coincida en todas las env vars de Vercel |
| P4 | **Probar push en dispositivo real** | Chrome Android + Safari iOS 16.4+ con Home Screen |

### Mejoras de corto plazo

| # | Tarea | Detalle |
|---|-------|---------|
| M1 | **Sonido en el display** | Reproducir un beep/chime cuando cambia el turno. API: `new Audio('/sounds/chime.mp3').play()` en el Realtime handler |
| M2 | **Múltiples operadores por cola** | Hoy una cola puede tener solo un operador activo. Agregar campo `ventanilla` al admin para que varios operen la misma cola en paralelo |
| M3 | **Estimación de tiempo real** | Reemplazar los 5 min fijos por el promedio real calculado de `called_at - created_at` de los tickets del día |
| M4 | **Notificación "turno llamado"** | Además de "próximo", avisar cuando el turno exacto del usuario es llamado (ya capturado en Realtime, agregar push con canal separado) |
| M5 | **Reseteo automático** | Cron job diario (Vercel Cron o Supabase pg_cron) que ejecute `reset_daily_queues()` a las 00:00 |
| M6 | **Pantalla de turno cancelado en display** | Cuando un ticket con status `called` se marca ausente, el display podría mostrar brevemente "Turno ausente" |

### Mejoras de mediano plazo

| # | Tarea | Detalle |
|---|-------|---------|
| L1 | **Página de analytics/historial** | Tickets por día, tiempo promedio de espera, picos de demanda. Supabase tiene funciones de agregación |
| L2 | **Gestión de colas desde admin** | Activar/desactivar colas, cambiar nombre e icono, reordenar — hoy requiere SQL directo |
| L3 | **Horarios de atención** | Mostrar colas disponibles solo en el horario configurado. Tabla `queue_hours` con apertura/cierre |
| L4 | **Multi-tenant** | Soporte para múltiples sucursales o negocios. Agregar tabla `tenants` y aislar queues por tenant |
| L5 | **Exportar historial** | Botón en admin para descargar CSV de tickets del día/semana |
| L6 | **App nativa (opcional)** | Envolver la PWA con Capacitor para distribuir en App Store / Play Store con notificaciones más confiables |
| L7 | **Anuncio por voz** | Text-to-speech en el display: "Turno B-023, por favor pase a ventanilla 2" |

### Deuda técnica

| # | Tarea | Detalle |
|---|-------|---------|
| D1 | **Seguridad RLS más estricta** | Actualmente todos los tickets son públicamente actualizables. Mejorar a validar por token |
| D2 | **Rate limiting en kiosco** | Agregar middleware de rate limiting para evitar generación masiva de tickets |
| D3 | **Tests** | No hay tests automatizados. Agregar al menos tests de las Server Actions con Jest/Vitest |
| D4 | **Error boundaries** | Agregar `error.tsx` en las rutas para manejar fallos de red graciosamente |

---

## 10. Deploy a Vercel

### Estado actual — **EN PRODUCCION** ✓

| Recurso | URL |
|---------|-----|
| **App (produccion)** | https://turnos-app-lilac.vercel.app |
| **Inspect (ultimo deploy)** | https://vercel.com/wrbc-s-projects/turnos-app/B1sn7m1V6CfwXz5xdoCTC6iFbnap |
| **Dashboard proyecto** | https://vercel.com/wrbc-s-projects/turnos-app |

**Rutas disponibles:**
- `https://turnos-app-lilac.vercel.app/kiosk` — Kiosco
- `https://turnos-app-lilac.vercel.app/display` — Display TV
- `https://turnos-app-lilac.vercel.app/admin` — Panel operador
- `https://turnos-app-lilac.vercel.app/ticket/[token]` — Vista movil (via QR)

**Credenciales Vercel:**
- Scope/Team: `wrbc-s-projects` (ID: `team_vxbMsv5IeQwwf0VaMXai9605`)
- Project ID: `prj_RAzUXmCT9sVSXPaRHeLd8NjivODk`
- Token: guardado localmente en `.env.local` / revocar en vercel.com/account/tokens

**Redeploy manual:**
```bash
npx vercel --prod --token TU_TOKEN_VERCEL --scope wrbc-s-projects
```

#### Configurar dominio custom (opcional)
Vercel Dashboard → tu proyecto → Settings → Domains → Add domain

### Límites del plan free de Vercel
| Recurso | Límite |
|---------|--------|
| Bandwidth | 100 GB/mes |
| Serverless Function Invocations | 100K/mes |
| Build minutes | 6000 min/mes |
| Dominios custom | Ilimitados |

---

## 11. Operación diaria

### Al inicio del día
1. Abrir `/admin` → Login con `admin@turnos.com` / `turnos2024!`
2. Click en **Reiniciar turnos del día** → confirmar
3. Abrir `/display` en la TV de la sala de espera (modo pantalla completa con F11)
4. Abrir `/kiosk` en la tablet del mostrador (modo pantalla completa, considerar kiosk mode del OS)

### Durante el día
- El operador selecciona su cola y presiona **Llamar siguiente** por cada turno atendido
- Si el usuario no se presenta: **Marcar ausente** → avanza al siguiente
- Si necesita repetir el llamado: **Reiterar llamado**

### Al cerrar el día
- Click en **Reiniciar turnos del día** para limpiar los contadores (o esperar el reset automático si se configura M5)
- Click en **Salir** para cerrar sesión del admin

### Agregar un nuevo operador
1. Ir a https://supabase.com/dashboard/project/bqvgsloqmaywnmtvlavz/auth/users
2. Click **Add user** → completar email y contraseña
3. El nuevo usuario puede hacer login en `/admin` directamente

---

*Proyecto desarrollado con Claude Code — amceesystems@gmail.com*
