#!/usr/bin/env bash

while true
do
    echo Fetching message ...
    if curl -fk https://mq.kube2go.io/v1/messages ; then
        echo Building ...
        time bash -c 'rm -rf s2n && git clone --depth 1 https://github.com/awslabs/s2n.git && pushd s2n && make bin && popd'
        echo Done ...
    else
        echo Failed to get message
        sleep 1
    fi
done
