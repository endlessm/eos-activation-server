#!/bin/bash -e

CURRENT_DIR=$(readlink -f $(dirname $0))

echo "WARNING! Make sure that the sysmgr key is in your agent!"
read -rsp $'Press any key to continue...\n' -n 1 key

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

ANSIBLE_CONFIG=${CURRENT_DIR}/ansible.cfg \
  ANSIBLE_HOST_KEY_CHECKING=False \
    ansible-playbook -vi hosts ${CURRENT_DIR}/deploy_server.yml
