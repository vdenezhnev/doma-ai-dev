FROM node:14.10-alpine as build

WORKDIR /acms
COPY . .
ARG API_HOST
ENV API_HOST=${API_HOST} 
ENV API_URL_INTERCOM=api/web/intercoms
ENV API_URL_ADMIN=api/admin
ARG APP_INTERCOM_TITLE
ARG APP_BRAND_ID
ENV APP_INTERCOM_TITLE=${APP_INTERCOM_TITLE}
ENV APP_BRAND_ID=${APP_BRAND_ID}
RUN npm i

RUN npm run build

FROM nginx:alpine
COPY --from=build /acms/dist /acms/dist
COPY ./nginx/frontend.conf /etc/nginx/conf.d/default.conf
