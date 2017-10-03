FROM debian
EXPOSE 80
RUN apt-get -y update && apt-get -y install nginx tar wget xz-utils supervisor

RUN cd /tmp ; \
wget https://nodejs.org/download/release/v4.8.4/node-v4.8.4-linux-x64.tar.xz ; \
tar xf node-v4.8.4-linux-x64.tar.xz ; \
mv node-v4.8.4-linux-x64/lib/node_modules/ /usr/local/lib/ ; \
cp -a node-v4.8.4-linux-x64/bin/* /usr/local/bin/

ADD server/*.* /root/
RUN cd /root && npm i ; \
rm -f /etc/nginx/sites-enabled/default

ADD nginx-configmap/default.conf /etc/nginx/conf.d/
ADD nginx-configmap/index.html /usr/share/nginx/html/
ADD nginx-configmap/timeClient.js /usr/share/nginx/html/

ADD supervisord/* /etc/supervisor/conf.d/
CMD ["supervisord", "--nodaemon"]

