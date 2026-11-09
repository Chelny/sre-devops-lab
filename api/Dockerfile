# Stage 1 : build ----------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.9.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# Stage 2 : runtime ----------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@12.9.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

COPY --from=build /app/dist ./dist

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", "dist/index.js"]