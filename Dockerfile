# Copyright © 2016-2024 Endless OS Foundation LLC
# SPDX-License-Identifier: GPL-2.0-or-later

FROM node:22-bookworm-slim

# Make sure ca-certificates is installed so TLS connections can be made.
RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get install -y ca-certificates && \
    apt-get clean

COPY . /opt/eos-activation-server
WORKDIR /opt/eos-activation-server
ENV NODE_ENV test
RUN npm install
EXPOSE 3000
USER nobody
HEALTHCHECK CMD ./healthcheck
CMD ["npm", "start"]
