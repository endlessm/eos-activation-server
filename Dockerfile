ARG GITHUB_TOKEN

# This stage of the build is just to fetch the vendor signer submodule.
FROM debian:buster-slim as submodule
ARG GITHUB_TOKEN
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        ca-certificates \
        git
COPY . /opt/eos-activation-server
RUN git clone https://$GITHUB_TOKEN@github.com/endlessm/eos-activation-server-vendor-signer /opt/eos-activation-server-vendor-signer && \
    git -C /opt/eos-activation-server submodule update --init && \
    rm -rf /opt/eos-activation-server/.git* /opt/eos-activation-server/util/vendor/real_signer/.git*

# The actual used layer
FROM node:10-buster-slim
COPY --from=submodule /opt/eos-activation-server /opt/eos-activation-server/
WORKDIR /opt/eos-activation-server
ENV NODE_ENV test
RUN npm install
EXPOSE 3000
USER nobody
HEALTHCHECK CMD ./healthcheck
CMD ["npm", "start"]
