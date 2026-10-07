# Production image of the API (Koyeb, or any container host).
# Build from the repository root: docker build -f apps/api/Dockerfile .

FROM node:24-slim AS build
WORKDIR /app
# Prisma's engines need OpenSSL, missing from the slim image.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Workspace manifests first: dependencies are cached until they change.
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/i18n/package.json packages/i18n/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
# Only the API and what it uses (not the mobile app's dependencies).
RUN npm ci --workspace @klotho/api --workspace @klotho/shared --include-workspace-root

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @klotho/shared \
  && cd apps/api && npx prisma generate && npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
# Prisma's engines need OpenSSL, missing from the slim image.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
WORKDIR /app/apps/api
USER node
EXPOSE 3100
ENV PORT=3100
# Pending migrations first, then the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
