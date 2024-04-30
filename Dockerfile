# Copyright © 2016-2024 Endless OS Foundation LLC
# SPDX-License-Identifier: GPL-2.0-or-later

FROM node:10-buster-slim
COPY . /opt/eos-activation-server
WORKDIR /opt/eos-activation-server
ENV NODE_ENV test
RUN npm install
EXPOSE 3000
USER nobody
HEALTHCHECK CMD ./healthcheck
CMD ["npm", "start"]
