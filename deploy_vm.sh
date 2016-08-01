#!/bin/bash -e

if [ $# != 1 ]; then
  echo "Usage: $0 <github_deployment_token>"
  exit 1
fi

WORKING_DIR=$(pwd -P)/$(dirname "$0")
DEPLOYMENT_TOKEN="${1}"

# No easy way to do this from ansible so let's just grab it directly from file
VM_TARGET=$(cat packer/hosts | tail -1 | awk '{print $1}')
VM_USER=$(cat packer/hosts | tail -1 | awk '{print $2}' | awk -F= '{print $2}')

echo "Host: ${VM_TARGET}"
echo "User: ${VM_USER}"

# Check if the key is already installed
set +e
  ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no -o StrictHostKeyChecking=no $VM_USER@$VM_TARGET true &>/dev/null
  have_key=$?
set -e

# Copy our SSH key
if [ $have_key ]; then
  ssh-copy-id -o StrictHostKeyChecking=no $VM_USER@$VM_TARGET >/dev/null
fi

# Get python2 installed for Ansible, but only if missing
ssh $VM_USER@$VM_TARGET -t  'dpkg -s python &>/dev/null || sudo apt-get install -y python python-simplejson'

pushd packer >/dev/null
  trap "popd >/dev/null" EXIT

  # Run the configuration
  ansible-playbook -v -K \
                   -i hosts ${WORKING_DIR}/packer/main.yml \
                   --extra-vars "activation_deploy_token=\"$DEPLOYMENT_TOKEN\""
