#!/bin/sh
sudo launchctl limit maxfiles 65536 65536
sudo launchctl limit maxproc 2048 2048
ulimit -n 65536
ulimit -u 2048
mongod -f./mongod.conf >>/dev/null 2>&1 &