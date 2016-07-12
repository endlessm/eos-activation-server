#!/bin/bash -e

CURRENT_DIR=$(dirname $(readlink -f $0))
export HTTP_PORT=3030

pushd $CURRENT_DIR > /dev/null
  # Kill old server if one is up
  if [ "$(netstat -lnt | awk '$6 == "LISTEN" && $4 ~ ".3030"')" != "" ]; then
    lsof -i:$HTTP_PORT -t | xargs kill
  fi

  npm start &
  server_pid=$!

  # Kill server on exit
  trap "kill $server_pid || true" EXIT

  # Wait for server to come up
  while [ "$(netstat -lnt | awk '$6 == "LISTEN" && $4 ~ ".3030"')" == "" ]; do
    sleep 0.05
  done

  ./node_modules/.bin/mocha --recursive --check-leaks
popd
