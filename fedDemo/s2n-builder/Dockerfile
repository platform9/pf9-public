FROM debian
RUN apt-get -y update && apt-get -y install git make gcc libssl-dev curl vim
ADD fetch_and_build.sh /usr/bin/
CMD cd /tmp && fetch_and_build.sh

