#!/bin/bash -e

if [ $# != 1 ]; then
  echo "Usage: $0 <github_deployment_token>"
  exit 1
fi

DEPLOYMENT_TOKEN="${1}"

# Latest packer version - keep updated
LATEST_VERSION=0.12.3

CURRENT_DIR=$(readlink -f $(dirname $0))

case $( uname -m ) in
  x86_64)
    PACKER_ARCH="amd64"
    ;;
  i?86)
    PACKER_ARCH="386"
    ;;
  *)
    echo "ERROR: unknown machine_type: $(uname -m)"
    exit 1
    ;;
esac

echo WARNING! This script will add various junk to your
echo WARNING! machine so it is best to run it in a VM!

if ! ( which git &>/dev/null && \
       which unzip &>/dev/null && \
       which python2 &>/dev/null && \
       which pip &>/dev/null ); then
  echo Installing pre-requisites
  sudo apt-get update
  sudo apt-get install -y git \
                          unzip \
                          python \
                          python-pip
fi

if ! which aws >/dev/null; then
  echo Installing awscli
  sudo pip install --upgrade awscli
fi

# Sanity check
if ! aws ec2 describe-instances > /dev/null; then
  echo You do not seem to have proper AWS credentials! Exiting!
  exit 1
else
  echo "Access: OK"
fi

admin_dir=${CURRENT_DIR}/tools/eos-administration
if [ -d ${admin_dir} ]; then
  echo Updating eos-administration
  git -C ${admin_dir} pull
else
  echo Cloning eos-administration
  git clone git@github.com:endlessm/eos-administration.git ${admin_dir}
fi

echo Fetching latest Packer
binary_package=packer_${LATEST_VERSION}_linux_${PACKER_ARCH}.zip
if [ ! -f ${binary_package} ]; then
  wget https://releases.hashicorp.com/packer/${LATEST_VERSION}/${binary_package}
fi

# Expand the latest packer
target_directory=packer_${LATEST_VERSION}_linux_${PACKER_ARCH}
if [ ! -d ${target_directory} ]; then
  unzip ${binary_package} -d ${target_directory}
  if [ -e packer_latest ]; then
    rm packer_latest
  fi
  ln -sf ${target_directory} packer_latest
fi

echo ===== Building... =====
pushd $CURRENT_DIR >/dev/null
 start_time=$(date +%s)

 ACTIVATION_DEPLOY_TOKEN="${DEPLOYMENT_TOKEN}" packer_latest/packer \
                                                   -machine-readable \
                                                   build packer.json | \
                                                 tee packer_build.log

 end_time=$(date +%s)

 echo ===== Completed \($(($end_time - $start_time)) sec\) =====

 # Extract the built image info
 artifact=$(grep '\,artifact\,0\,id\,' packer_build.log | awk -F, '{print $6}')

 if [ -z "${artifact}" ]; then
   echo "ERROR: Couldn't parse ID from packer output."
   exit 2
 fi

  echo
  echo
  echo =============================
  ami_id=$( echo ${artifact} | cut -d: -f2)
  echo updating ami_image.txt with ${ami_id}
  echo "$ami_id" > ami_image.txt
  echo =============================
popd >/dev/null

echo Done
