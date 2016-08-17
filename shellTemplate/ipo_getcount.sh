#!/bin/sh
datex=`date -d "$1" +%Y%m%d`
path=/data/apps/infi/innSite/ipo_dumps/$datex
cat $path/*/user_register_logs.txt | wc -l
cat $path/*/user_login_logs.txt | wc -l
cat $path/*/vir_money_logs.txt | wc -l
date1=`date -d "$1" +%s`
date2=$((date1+86400))
echo "$date1 $date2"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:\"RegisterLog\",timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:\"LogInLog\",timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"