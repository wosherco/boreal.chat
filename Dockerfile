FROM node:22.16-slim AS base

RUN npm install -g pnpm@9.12.2

WORKDIR /app

# Copying needed files
COPY ./package.json /app/package.json
COPY ./.npmrc /app/.npmrc
COPY ./.nvmrc /app/.nvmrc
COPY ./pnpm-lock.yaml /app/pnpm-lock.yaml
COPY ./.env.example /app/.env.example

FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build

ENV PUBLIC_ENVIRONMENT=production
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Copying needed folders
COPY . .

RUN cp .env.example .env
RUN CI=1 pnpm build

# Actual deploy
FROM base AS app
COPY --from=build /app/build /prod/build
COPY --from=build /app/package.json /prod/package.json
COPY --from=build /app/pnpm-lock.yaml /prod/pnpm-lock.yaml
COPY --from=build /app/drizzle /prod/drizzle
COPY --from=build /app/drizzle.config.ts /prod/drizzle.config.ts
COPY --from=build /app/node_modules /prod/node_modules
WORKDIR /prod

ENV PUBLIC_ENVIRONMENT=production
ENV NODE_ENV=production

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"


CMD ["pnpm", "start"]

