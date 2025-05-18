FROM node:alpine

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY .env.test .env.test
COPY apps/files apps/files
COPY libs libs
COPY prisma prisma


RUN npm install -g pnpm
RUN pnpm install
RUN npx prisma generate
RUN pnpm run build files

CMD ["pnpm", "start:dev", "files"]