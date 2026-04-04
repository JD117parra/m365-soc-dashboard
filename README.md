# M365 SOC Dashboard

A Security Operations Center (SOC) dashboard that connects to Microsoft 365 via the **Microsoft Graph Security API** and displays security alerts, incidents, risky users, and Secure Score in real time.

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Vue 3)                       │
│  MSAL.js v3 ──► Azure AD ──► access token                   │
│  Vue Router / Pinia / Chart.js / shadcn-vue / Tailwind CSS   │
└──────────────┬───────────────────────────────────────────────┘
               │ HTTP + WebSocket  (Vite proxy → :8080)
┌──────────────▼───────────────────────────────────────────────┐
│                    Go + Gin Server (:8080)                    │
│  JWT middleware  ──►  Graph API service  ──►  /ws handler     │
└──────────────┬───────────────────────────────────────────────┘
               │ HTTPS (client credentials)
┌──────────────▼───────────────────────────────────────────────┐
│              Microsoft Graph Security API v1.0               │
│  /security/alerts_v2  /security/incidents                    │
│  /identityProtection/riskyUsers  /security/secureScores      │
└──────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20 LTS |
| Go | 1.22 |
| Azure App Registration | — |

### Azure App Registration

1. Go to **Azure Portal → Azure Active Directory → App registrations → New registration**.
2. Set **Redirect URI** to `http://localhost:5173` (Single-page application).
3. Under **Certificates & secrets**, create a new **Client secret** — save the value.
4. Under **API permissions**, add the following **Application** (not Delegated) permissions and grant admin consent:

| Permission | Type | Required for |
|---|---|---|
| `SecurityAlert.Read.All` | Application | /security/alerts_v2 |
| `SecurityIncident.Read.All` | Application | /security/incidents |
| `IdentityRiskyUser.Read.All` | Application | /identityProtection/riskyUsers |
| `SecurityEvents.Read.All` | Application | /security/secureScores |

---

## Environment Variables

Copy `.env.example` and fill in your values.

```bash
cp .env.example server/.env
cp .env.example client/.env
```

### Backend (`server/.env`)

| Variable | Description |
|---|---|
| `TENANT_ID` | Azure AD tenant ID |
| `CLIENT_ID` | App Registration client ID |
| `CLIENT_SECRET` | App Registration client secret |
| `PORT` | HTTP server port (default: `8080`) |

### Frontend (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_TENANT_ID` | Azure AD tenant ID |
| `VITE_CLIENT_ID` | App Registration client ID |
| `VITE_REDIRECT_URI` | OAuth redirect URI (default: `http://localhost:5173`) |

---

## Installation

### 1. Clone and install frontend dependencies

```bash
cd client
npm install
```

### 2. Install backend dependencies

```bash
cd server
go mod tidy
```

---

## Running the Application

### Start the Go backend

```bash
cd server
go run main.go
# Server listening on :8080
```

### Start the Vite dev server (separate terminal)

```bash
cd client
npm run dev
# Frontend available at http://localhost:5173
```

Open your browser at `http://localhost:5173` and sign in with your Microsoft 365 account.

---

## Project Structure

```
m365-soc-dashboard/
├── client/                    Vue 3 + Vite frontend
│   ├── src/
│   │   ├── components/        Shared UI components (AppLayout, StatCard, SeverityBadge)
│   │   ├── composables/       Vue composables — data fetching and WebSocket
│   │   ├── lib/               MSAL config, utility functions
│   │   ├── pages/             Route-level page components
│   │   ├── router/            Vue Router configuration
│   │   ├── services/          Graph API HTTP client
│   │   ├── types/             TypeScript interfaces for Graph API responses
│   │   ├── App.vue
│   │   ├── index.css          Tailwind + shadcn-vue CSS variables
│   │   └── main.ts            Bootstrap: MSAL initialize → createApp → mount
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
└── server/                    Go + Gin backend
    ├── config/config.go        Environment variable loading
    ├── handlers/security.go   HTTP and WebSocket handlers
    ├── middleware/auth.go      JWT validation against Azure AD JWKS
    ├── routes/routes.go        Route registration + CORS
    ├── services/graph.go       Microsoft Graph API calls
    ├── go.mod
    └── main.go
```

---

## WebSocket

The backend pushes live alert updates over WebSocket at `ws://localhost:8080/ws`.

Browsers cannot send custom headers during a WebSocket upgrade, so the frontend passes the MSAL access token as a query parameter:

```
ws://localhost:8080/ws?token=<access_token>
```

The server validates the token using the same JWT middleware logic before upgrading the connection. Alerts are broadcast every 30 seconds.

---

## Build for Production

```bash
# Frontend
cd client && npm run build   # output → client/dist/

# Backend
cd server && go build -o soc-dashboard .
```

Serve `client/dist/` from a static host (Nginx, Azure Static Web Apps, etc.) and deploy the Go binary with environment variables set.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Vue 3 (Composition API, `<script setup>`) |
| Build tool | Vite 5 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn-vue |
| Charts | Chart.js 4 + vue-chartjs 5 |
| State | Pinia |
| Routing | Vue Router 4 |
| Auth (frontend) | MSAL.js v3 (`@azure/msal-browser`) |
| Backend | Go 1.22 + Gin |
| Auth (backend) | JWT validation against Azure AD JWKS |
| Real-time | WebSockets (`nhooyr.io/websocket`) |
| Graph API | Microsoft Graph Security API v1.0 |
