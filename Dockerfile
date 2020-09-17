FROM node:14.10-alpine as build

WORKDIR /acms
COPY . .
ARG API_HOST
ENV API_HOST=${API_HOST} 
RUN npm i

RUN npm run build

FROM nginx:alpine
COPY --from=build /acms/dist /acms/dist
COPY ./nginx/frontend.conf /etc/nginx/conf.d/default.conf
