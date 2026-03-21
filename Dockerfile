FROM node:20-alpine AS base

# --- Etapa 1: Instalar TODAS las dependencias (incluye devDependencies para build) ---
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- Etapa 2: Build de Next.js ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno necesarias en build-time para Next.js (NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME=facturIA
ARG RESEND_API_KEY
ARG GEMINI_API_KEY
ARG GOOGLE_GENERATIVE_AI_API_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV GOOGLE_GENERATIVE_AI_API_KEY=$GOOGLE_GENERATIVE_AI_API_KEY

RUN npm run build

# --- Etapa 3: Imagen final optimizada (solo standalone output) ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
