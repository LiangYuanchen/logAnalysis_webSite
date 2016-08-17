#!/bin/sh

while true
do
        n=`ps ax|grep -w "node --max-old-space-size="$1" keystone.js"|grep -cv grep`
# n=`ps ax|grep -w 'node keystone.js'|grep -cv grep`
        if [ $n -lt 1 ]; then
			version=`date +%Y%m%d_%H%M`
			#node --max-old-space-size=$1 keystone.js >/dev/null 2>&1
			node --max-old-space-size=$1 keystone.js >> log.log$version &
			echo "restart node keystone.js at "+$version
        fi
        sleep 3
done
