#!/bin/bash -e

APP_NAME='eos-activation-server'
CURRENT_DIR=$(dirname $(readlink -f $0))
PM2=./node_modules/pm2/bin/pm2

pushd $CURRENT_DIR > /dev/null
  trap "$PM2 delete $APP_NAME || true" EXIT

  echo "Starting $APP_NAME in cluster mode..."
  $PM2 start app.js --watch \
                    --name $APP_NAME
  echo "Launched"
  $PM2 logs $APP_NAME
popd
