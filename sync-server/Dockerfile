FROM node:22-alpine AS build

RUN npm install --global npm@11.17.0 --min-release-age=14

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY tsconfig.json tsup.config.* ./
COPY src/ src/
RUN npm run build


FROM node:22-alpine

RUN npm install --global npm@11.17.0 --min-release-age=14

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/ dist/

ENV HOST=0.0.0.0
ENV PORT=3030
ENV STORAGE_PATH=/data

EXPOSE 3030

VOLUME /data

CMD ["node", "dist/index.js"]
