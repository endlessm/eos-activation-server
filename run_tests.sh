#!/bin/bash -e

CURRENT_DIR=$(dirname $(readlink -f $0))
export HTTP_PORT=3030

JENKINS_OUTPUT="false"
if [ $# -gt 0 ] && [ "$1" == "--jenkins" ]; then
  echo "Jenkins reporter activated"
  JENKINS_OUTPUT="true"
fi

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
popd
