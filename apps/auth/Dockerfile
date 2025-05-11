FROM node:alpine

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY .env.test .env.test
COPY apps/auth apps/auth
COPY libs libs
COPY prisma prisma


RUN npm install -g pnpm
RUN pnpm install
RUN npx prisma generate
RUN pnpm run build auth

CMD ["pnpm", "start:dev", "auth"]