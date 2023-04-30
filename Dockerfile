FROM node:18-alpine
WORKDIR /
COPY package* /
RUN npm install 
COPY . .
