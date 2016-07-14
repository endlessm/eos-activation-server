#!/bin/bash -e

CURRENT_DIR=$(dirname $(readlink -f $0))
PM2="./node_modules/pm2/bin/pm2"

export HTTP_PORT=3030
export NODE_ENV=test

JENKINS_OUTPUT="false"
if [ $# -gt 0 ] && [ "$1" == "--jenkins" ]; then
  echo "Jenkins reporter activated"
  JENKINS_OUTPUT="true"
fi

pushd $CURRENT_DIR > /dev/null
  if [ "$JENKINS_OUTPUT" == "true" ]; then
    echo "Killing old server if one is up"
    if [ "$(netstat -lnt | awk '$6 == "LISTEN" && $4 ~ ".3030"')" != "" ]; then
      lsof -i:$HTTP_PORT -t | xargs kill
    fi

    echo "Starting server"
    node app.js &

    server_pid=$!
    trap "kill $server_pid &>/dev/null || true" EXIT
  else
    if [ "$($PM2 info  eos-activation-server --no-color | grep status | grep online)" == "" ]; then
      $PM2 --watch . \
           --ignore-watch "\.git ^test" \
           -i 1 \
           -n eos-activation-server \
           start ./app.js


      # XXX: Inline debugging if you find issues with the tests
      # $PM2 logs eos-activation-server &
      # logging_process=$!
      # trap "kill $logging_process &>/dev/null || true" EXIT
    fi

    # XXX: During tests we bind on localhost only so no need to kill it
    #      and it speeds up the launch by a huge amount but if you're
    #      paranoid feel free to uncomment the next line.
    # trap "$PM2 stop -s eos-activation-server || true" EXIT
  fi

  echo "Waiting for server to come up..."
  while [ "$(netstat -lnt | awk '$6 == "LISTEN" && $4 ~ ".3030"')" == "" ]; do
    sleep 0.05
  done

  echo "Running tests..."
  if [ "$JENKINS_OUTPUT" == "true" ]; then
    rm -f reports/*.xml

    export JUNIT_REPORT_NAME="Activation Server Tests"
    export JUNIT_REPORT_PATH=reports/report.xml
    export JUNIT_REPORT_STACK=1
    export JUNIT_REPORT_PACKAGES=1

    ./node_modules/.bin/mocha --recursive \
                              --check-leaks \
                              --reporter mocha-jenkins-reporter || true
  else
    ./node_modules/.bin/mocha --recursive --check-leaks
  fi
popd >/dev/null
