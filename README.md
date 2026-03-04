# Pokétype Frontend

Mobil-first React + TypeScript + Tailwind CSS App für die [Pokétype API](../poketype-api).

## Stack

- **Create React App** (TypeScript)
- **Tailwind CSS v3**

## Starten

```bash
cd poketype-frontend
npm install

# Optional: API-URL konfigurieren (Standard: http://localhost:3000)
cp .env.example .env

npm start   # → http://localhost:3000 (CRA default)
```

## Konfiguration

| Variable | Beschreibung | Standard |
|---|---|---|
| `REACT_APP_API_URL` | Base-URL der Pokétype API | `http://localhost:3000` |

## Build

```bash
npm run build
# Output: build/
```
