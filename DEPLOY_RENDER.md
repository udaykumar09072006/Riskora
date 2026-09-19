# Deploying FraudShield AI to Render

FraudShield AI is fully configured for zero-friction deployment on [Render](https://render.com) as a Node.js Web Service.

---

## Method 1: Deploy with Blueprint (`render.yaml`) — Recommended

The repository includes a ready-to-use `render.yaml` file that sets up the web service, build commands, and health check endpoints automatically.

1. Push this project to your **GitHub** or **GitLab** account.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Connect your repository.
5. Render will automatically detect `render.yaml` and configure:
   - **Service Name**: `fraudshield-ai`
   - **Environment**: `Node`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start` (runs `node dist/server.cjs`)
   - **Health Check Path**: `/api/v1/health`
6. Add your environment variables:
   - `GEMINI_API_KEY`: *(Optional, for AI-generated SOC case reports)*
   - `NODE_ENV`: `production`
7. Click **Apply**. Render will build and deploy your application.

---

## Method 2: Manual Web Service Setup

If you prefer to configure the service manually in the Render dashboard:

1. Click **New +** > **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `fraudshield-ai`
   - **Region**: Any (e.g. *Oregon, US West* or *Frankfurt, EU*)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` or `Starter`
4. Expand **Advanced** and set:
   - **Health Check Path**: `/api/v1/health`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = `your_gemini_api_key_here` (optional)
6. Click **Create Web Service**.

---

## How It Works

- **Build Phase**: Vite compiles the React + Tailwind frontend assets into `/dist`, and `esbuild` compiles `server.ts` into a self-contained CommonJS production bundle at `/dist/server.cjs`.
- **Runtime Phase**: In production, `node dist/server.cjs` launches the Express server, binds to host `0.0.0.0` on Render's dynamic `$PORT` (default `10000`), serves the static frontend with SPA fallback routing, and powers all `/api/v1/*` backend endpoints.
- **Health Check**: The `/api/v1/health` endpoint returns `200 OK` with platform metrics and latency tracking.
