# syntax = docker/dockerfile:1.2

FROM node:18-alpine
WORKDIR /
COPY package* /
RUN npm install 
RUN --mount=type=secret,id=_env,dst=/etc/secrets/.env cat /etc/secrets/.env
COPY .env /
COPY . .