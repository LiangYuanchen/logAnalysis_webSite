#!/bin/sh
cd ../
mv ./run /tmp/run.bak
sed 's/256/2048/g' /tmp/run.bak > ./run
sudo chmod 751 ./run
