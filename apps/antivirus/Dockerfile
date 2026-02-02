FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY .env.test .env.test
COPY apps/antivirus apps/antivirus
COPY libs libs


RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
RUN pnpm run build antivirus

CMD ["pnpm", "start:dev", "antivirus"]