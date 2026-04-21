FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY apps/files apps/files
COPY libs libs

RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN npx prisma generate --schema=apps/files/src/prisma/schema.prisma
RUN pnpm run build files

CMD sh -c "npx prisma migrate deploy --schema=apps/files/src/prisma/schema.prisma && pnpm start:dev files"