ARG NODE_VERSION=26.12.1
FROM node:${NODE_VERSION}-bookworm-slim

WORKDIR /home/node/app
RUN chown node:node /home/node/app

COPY --chown=node:node package.json package-lock.json ./
USER node
RUN npm ci

COPY --chown=node:node . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
