#!/bin/sh
memcacheq -d -r -H /data/memcacheq -N -R -v -L 1024 -B 1024 > /data/mq_error.log 2>&1