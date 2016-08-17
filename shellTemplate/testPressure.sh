#!/bin/sh
pid=`ps -ef | grep mongod | grep -v grep | awk '{print $2}'`
indexSize=`mongo innsite --eval "db.stats().indexSize" | awk 'NR>=3 {print int($1)/1024/1024}'`
memSize=`mongo innsite --eval "db.serverStatus().mem.virtual" | awk 'NR>=3 {print int($1)/1024}'`
stackSize=`cat /proc/$pid/limits | grep stack | awk -F 'size' '{print int($NF)/1024/1024}'`
echo "$memSize"