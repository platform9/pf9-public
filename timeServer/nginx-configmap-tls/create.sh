#!/usr/bin/env bash
kubectl create configmap nginx--config-tls --from-file=index.html=index.html --from-file=timeClient.js=timeClient.js --from-file=default.conf=default.conf --from-file=key.pem=key.pem --from-file=cert.pem=cert.pem
