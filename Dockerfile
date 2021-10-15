FROM node:14-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM node:14-alpine

WORKDIR /app

COPY --from=build /app ./

CMD node ./build
