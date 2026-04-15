FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsup.config.* ./
COPY src/ src/
RUN npm run build


FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/ dist/

ENV HOST=0.0.0.0
ENV PORT=3030
ENV STORAGE_PATH=/data

EXPOSE 3030

VOLUME /data

CMD ["node", "dist/index.js"]
