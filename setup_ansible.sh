#!/bin/bash -e

echo WARNING! This script will add various junk to your
echo WARNING! machine so it is best to run it in a VM!

echo Fetching latest ansible

prerequisites="git \
               python \
               python-boto \
               python-crypto \
               python-httplib2 \
               python-jinja2 \
               python-netaddr \
               python-paramiko \
               python-pip \
               python-selinux \
               python-setuptools \
               python-yaml"

needs_prereqs=0
for prereq in ${prerequisites}; do
  if ! dpkg-query -l "${prereq}" &>/dev/null; then
    needs_prereqs=1
    break
  fi
done

if [ $needs_prereqs -eq 1 ]; then
  sudo apt-get update
  sudo apt-get install -y $prerequisites
fi

current_dir=$(pwd)

if [ ! -d ${current_dir}/ansible ]; then
  git clone https://github.com/ansible/ansible ${current_dir}/ansible
fi

pushd ${current_dir}/ansible >/dev/null
  git submodule init
  git submodule update

  echo Adding Ansible module fixes

  # XXX: We might consider using the same patches for every Ansible setup
  if [ -d ${current_dir}/ansible_patches ]; then
    for patch_file in ${current_dir}/ansible_patches/**/*; do
      patch_relative_dir=$(basename $(dirname ${patch_file}))

      pushd lib/ansible/modules/${patch_relative_dir} >/dev/null

      if [ ! -f "$(basename $patch_file)" ]; then
        echo "- Applying $(basename $patch_file) to \"${patch_relative_dir}\" module..."

        # Copied so we know if we applied it or not
        cp "${patch_file}" .

        git apply "${patch_file}"
      fi

      popd >/dev/null
    done
  fi
popd >/dev/null

echo Done

echo Run \"source ${current_dir}/ansible/hacking/env-setup\" to be able to use Ansible
