# Time Server sample program for Kubernetes

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
