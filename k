#!/bin/sh
did=`ps ax|grep "console.sh 2048"|grep -v grep|awk '{print $1}'`
pid=`ps ax|grep "node --max-old-space-size=2048 keystone.js"|grep -v grep|awk -F' ' '{print $1}'`

kill -9 $pid
kill -9 $did
version=`date +%Y%m%d_%H%M`
