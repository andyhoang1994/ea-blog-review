FROM node:15.3.0-alpine3.10
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . ./
EXPOSE 8000
CMD ["node", "./server/server.js"]