FROM node:8.4
MAINTAINER Federico Gonzalez <https://github.com/fedeg>

RUN apt-get update -qq \
 && apt-get install -y libzmq3 libzmq3-dev build-essential make

RUN apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN npm config set registry http://registry.npmjs.org
RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

RUN npm install -g foreman && npm cache clean --force
ADD package.json /usr/src/app/
RUN npm install && npm cache clean --force
ADD . /usr/src/app

RUN openssl genrsa -des3 -passout pass:x -out privkey.key 2048 && \
    openssl rsa -passin pass:x -in privkey.key -out privkey.pem && \
    openssl req -new -key privkey.pem -out privkey.csr \
        -subj "/C=UK/ST=Warwickshire/L=Leamington/O=OrgName/OU=IT Department/CN=example.com" && \
    openssl x509 -req -days 365 -in privkey.csr -signkey privkey.pem -out cert.pem && \
    rm privkey.key

EXPOSE 1883
EXPOSE 8443
EXPOSE 8083
EXPOSE 8883

CMD [ "nf", "start" ]
