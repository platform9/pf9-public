# Time Server sample program for Kubernetes

There are two ways to package and deploy the timeServer app:
1. Use a generic nginx image, and populate / customize it at deploy time using a Kubernetes configmap. Combine it with the timeServer node.js service container in a pod. Requires Kubernetes. This is the option described in this document. 
1. Build a custom standalone docker image containing both nginx and the node.js service and all configuration and artifacts. Does not require Kubernetes for deployment.

# Kubernetes specific method

## Building node.js app and publishing docker image

- cd server
- docker build -t current-time .
- docker images (make note of image id)
- docker login (user=platform9systems, pwd=xxx)
- docker tag image_id platform9systems/current-time:latest
- docker push platform9systems/current-time

## Deploying app on kubernetes

- cd nginx-configmap
- kubectl create configmap nginx-config --from-file=index.html=index.html --from-file=timeClient.js=timeClient.js --from-file=default.conf=default.conf
- kubectl create -f ../deployment.yaml
- kubectl create -f ../service.yaml


Initially has 1 replica. To scale to more replicas:

- kubectl scale --replicas=5 deployment time-server

## Viewing web app on client machine

- wait for time-server service to have at least one endpoint: kubectl describe service time-server 
- kubectl proxy
- navigate browser to http://localhost:8001/api/v1/proxy/namespaces/default/services/time-server/

# Stand-alone docker image

- cd to timeServer directory (the same one containing this README.md)
- docker build .
- make note of the image_id produced
- docker login (if necessary)
- docker tag image_id platform9systems/current-time-standalone:latest
- docker push platform9systems/current-time-standalone

