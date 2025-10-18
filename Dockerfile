FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache python3 py3-pip \
  && pip3 install --no-cache-dir factorio-rcon-py
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./
COPY --from=build /app/scripts ./scripts
COPY package*.json ./
RUN npm install --omit=dev

EXPOSE 8080
CMD ["node", "server.js"]
