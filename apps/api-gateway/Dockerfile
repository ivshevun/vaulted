FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY .env.test .env.test
COPY e2e e2e
COPY apps/api-gateway apps/api-gateway
COPY apps/files apps/files
COPY apps/auth apps/auth
COPY libs libs


RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN npx prisma generate --schema=apps/auth/src/prisma/schema.prisma
RUN npx prisma generate --schema=apps/files/src/prisma/schema.prisma
RUN pnpm run build api-gateway

CMD ["pnpm", "start:dev", "api-gateway"]