# Fuel Pass Web App

React/Vite frontend for the Fuel Pass ordering flow. The app uses the proxy service as its API base URL so browser traffic can reach auth and orders through one local origin.

## Local Development

From the repository root:

```sh
npm install
npm run setup:envs
npm run dev -w @fuel-pass/web-app
```

The generated `apps/web/web-app/.env` points `VITE_API_BASE_URL` at the local proxy (`http://localhost:3100`) by default.

## Useful Commands

```sh
npm run build -w @fuel-pass/web-app
npm run lint -w @fuel-pass/web-app
npm run check-types -w @fuel-pass/web-app
```

See the root `README.md` for full-stack setup, seeded login accounts, and API service details.
