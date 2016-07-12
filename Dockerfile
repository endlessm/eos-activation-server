FROM ubuntu:16.04
MAINTAINER Endless Services Team <services@endlessm.com>

RUN apt-get update && \
    apt-get dist-upgrade -y && \
    apt-get install -y apt-transport-https \
                       curl \
                       software-properties-common

LABEL version="0.1"

RUN curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo 'deb https://deb.nodesource.com/node_4.x wily main' > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs

# TODO run process as unprivileged user
CMD ["/opt/eos-activation-server/run_prod.sh"]

ENV NODE_ENV production

# Install modules (cached)
COPY package.json /opt/eos-activation-server/package.json
WORKDIR /opt/eos-activation-server

RUN npm install -g npm && \
    npm install

# Copy the rest of codebase
COPY . /opt/eos-activation-server
