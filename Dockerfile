# Install dependencies only when needed
FROM node:16-alpine AS deps

# Install libvips-dev for sharp compatibility
# RUN apk add --no-cache install libvips-dev

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# WORKDIR /app/strapi
# COPY /packages/strapi/package.json /packages/strapi/package-lock.json ./
# RUN npm ci

# Rebuild the source code only when needed
FROM node:16-alpine AS builder

WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# COPY --from=deps /app/strapi/node_modules ./packages/strapi/node_modules

ENV NODE_ENV production
RUN npx nx run strapi:build

# Production image, copy all the files and run Strapi
FROM node:16-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist/packages/strapi ./strapi
COPY --from=deps /app/node_modules ./node_modules
COPY /packages/strapi/database ./strapi/database
COPY /packages/strapi/public ./strapi/public
COPY /packages/strapi/scripts ./strapi/scripts
COPY /packages/strapi/favicon.png ./strapi/favicon.png
COPY /packages/strapi/package.json ./strapi/package.json
COPY /tsconfig.base.json ./strapi
COPY /packages/strapi/.env ./strapi

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 strapi

# Only needed for SQLite db for demonstrating purposes
RUN mkdir ./strapi/packages/.tmp
RUN chown -R strapi ./strapi/packages/.tmp

USER strapi

EXPOSE 1337

ENV NODE_ENV production

WORKDIR /app/strapi
CMD ["node", "scripts/start.js"]

