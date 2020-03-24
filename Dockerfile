FROM node:alpine

ENV NODE_ENV prod

RUN mkdir -p /home/app && mkdir /data
WORKDIR /home/app

RUN npm install pm2 -g

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install

COPY . /home/app

EXPOSE 3000
CMD pm2-runtime bin/www
