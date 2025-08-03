FROM node:alpine

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY .env.test .env.test
COPY apps/files apps/files
COPY libs libs


RUN npm install -g pnpm
RUN pnpm install
RUN npx prisma generate --schema=apps/files/src/prisma/schema.prisma
RUN pnpm run build files

CMD ["pnpm", "start:dev", "files"]