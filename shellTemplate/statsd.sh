#!/bin/sh
statsd=172.31.9.146
while true
do
sleep 57

ccu=$(ss -n state established sport = :5001|wc -l)
ccu=$(( ccu -1 ))
echo "TH_AN.all.onlineNew:$ccu|c" | timeout 3 nc -u -w1 $statsd 8125
echo "TH_AN.all.onlineNew:$ccu|c"
done