FROM node:alpine

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY .env.test .env.test
COPY e2e e2e
COPY apps/api-gateway apps/api-gateway
COPY libs libs
COPY prisma prisma


RUN npm install -g pnpm
RUN pnpm install
RUN npx prisma generate

RUN pnpm run build api-gateway

CMD ["pnpm", "start:dev", "api-gateway"]