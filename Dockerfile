FROM node:14.10-alpine

WORKDIR /acms
COPY . .
RUN npm i

RUN npm run build