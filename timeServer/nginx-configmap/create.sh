#!/usr/bin/env bash
kubectl create configmap nginx-config --from-file=index.html=index.html --from-file=timeClient.js=timeClient.js --from-file=default.conf=default.conf
