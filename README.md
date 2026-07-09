# Pokétype Frontend

Mobil-first **Next.js** + TypeScript + Tailwind CSS App für die [Pokétype API](../poketype-api).

## Stack

- **Next.js 15** (App Router, TypeScript)
- **React 19**
- **Tailwind CSS v4**
- **Zustand** (State), **socket.io-client** (Realtime), **LiveKit** (Video/Screen-Sharing)

## Starten

```bash
cd poketype-frontend
npm install

# Optional: API-URL konfigurieren (Standard: http://localhost:4000)
# In .env.local setzen, z. B.:
#   NEXT_PUBLIC_API_URL=http://localhost:4000

npm run dev   # → http://localhost:3000
```

Der Next.js-Dev-Server läuft auf Port `3000`, die [Pokétype API](../poketype-api) standardmäßig auf Port `4000`.

## Konfiguration

| Variable | Beschreibung | Standard |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base-URL der Pokétype API | `http://localhost:4000` |

`NEXT_PUBLIC_API_URL` muss zur Build-Zeit gesetzt sein (Deployment).

## Build

```bash
npm run build
npm start
```
