FROM node:14.10-alpine as build

WORKDIR /acms
COPY . .
ENV API_HOST https://apitest.smartairkey.com
RUN npm i

RUN npm run build

FROM nginx:alpine
COPY --from=build /acms/dist /acms/dist
COPY ./nginx/frontend.conf /etc/nginx/conf.d/default.conf
