#!/usr/bin/env bash

while true
do
    echo Fetching message ...
    if curl -fsS https://mq.kube2go.io/v1/topics/requests/messages ; then
        echo Building ...
        if rm -rf s2n && git clone --depth 1 https://github.com/awslabs/s2n.git && pushd s2n && make bin && popd; then
            echo build succeeded
            curl -fsS -X POST https://mq.kube2go.io/v1/topics/success/messages
        else
            echo build failed
            curl -fsS -X POST https://mq.kube2go.io/v1/topics/failure/messages
        fi

    else
        echo Failed to get message
        sleep 1
    fi
done
