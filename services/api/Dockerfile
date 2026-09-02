FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json ./
RUN pnpm install --prod --no-frozen-lockfile

COPY src ./src
COPY db ./db

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "src/index.js"]
