ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

RUN apk add --no-cache npm libusb-dev bluez-dev linux-headers eudev-dev build-base python git

RUN mkdir -p /app
WORKDIR /app

COPY ./package.json /app/package.json
RUN npm install --no-audit --production

COPY . /app
WORKDIR /app

CMD [ "node", "index.js" ]
