#!/bin/sh
mysql -h10.2.1.166 -uadmin -pK0CIgYTYx << EOF
use infiniteinn;
select count(*) from User_Register_Logs where date(Crt_DT)="$1";
select count(*) from Sys_orders where date(Crt_DT)="$1";
EOF
date1=`date -d "$1" +%s`
date2=$((date1+86400))
echo "$date1 $date2"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:\"Register\",timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:\"TavernBuyGem\",timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"