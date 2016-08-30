#!/bin/bash -e

CURRENT_DIR=$(readlink -f $(dirname $0))

# Setup Ansible - we want the latest
${CURRENT_DIR}/setup_ansible.sh

# We only have one flag - it's easy enough to do it with one `if`
BUILD_IMAGES=true
if [[ $# -ne 0 && "${1}" == "--skip-build" ]]; then
  BUILD_IMAGES=false
  shift
fi

if $BUILD_IMAGES; then
  if [[ $# -lt 1 ]]; then
    echo "Usage: $0 [--skip-build] <git_token>"
    exit 1
  fi

  GIT_TOKEN="${1}"

  echo "Building image. Token: $GIT_TOKEN"
  ${CURRENT_DIR}/build_image.sh "${GIT_TOKEN}"
fi

ansible-playbook -vi hosts \
                 ${CURRENT_DIR}/deploy_server.yml
