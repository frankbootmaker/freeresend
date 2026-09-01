# Base stage
FROM node:24-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Production builder stage
FROM base AS builder
WORKDIR /app
COPY . .
COPY package*.json ./
RUN npm ci --include=dev
RUN npm run build

FROM builder AS smtp
WORKDIR /app
ENV NODE_ENV=production
EXPOSE 2525 587 465
CMD ["npx", "tsx", "src/smtp/server.ts"]

# Last stage is the default image. `web` must stay Next.js, not SMTP.
FROM base AS production
WORKDIR /app

RUN apk add --no-cache postgresql16-client

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
