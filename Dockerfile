FROM node:14.10-alpine

WORKDIR /acms
COPY package.json .
RUN npm i

COPY . .
RUN npm run build