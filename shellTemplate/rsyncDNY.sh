sudo cat ./rsyncDNY.sh 
#!/bin/sh
#sudo su
git pull

rsync -aqvr --exclude node_modules --exclude '*.txt' --exclude serial_no --exclude '*.log' --exclude *.sh --exclude tools --exclude shellTemplate/*  ./innSite/* p1:~/server/innSite 