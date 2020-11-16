FROM node:14 AS prod-install
ADD . /app
WORKDIR /app

RUN apt update
RUN apt install -y \
    python \
    make \
    g++ \
    locales
WORKDIR /app
RUN npm ci --only=production
RUN npm install --unsafe-perm full-icu > /dev/null 2>&1

FROM gcr.io/distroless/nodejs:14
WORKDIR /app
COPY --from=prod-install /app /app

EXPOSE 3000
EXPOSE 9091
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production
ENV NODE_ICU_DATA="/app/node_modules/full-icu"

CMD ["./node_modules/.bin/babel-node", "src/server.js"]
