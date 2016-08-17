#!/bin/sh
echo "mysql register order"
mysql -h10.2.1.166 -uadmin -pK0CIgYTYx << EOF
use infiniteinn;
select count(*) from User_Register_Logs where date(Crt_DT)="$1";
select count(*) from Sys_orders where date(Crt_DT)="$1";
EOF
datex=`date -d "$1" +%Y%m%d`
path=/data/apps/infi/innSite/ipo_dumps/$datex
echo "ipo register login money"
cat $path/*/user_register_logs.txt | wc -l
cat $path/*/user_login_logs.txt | wc -l
cat $path/*/vir_money_logs.txt | wc -l
date1=`date -d "$1" +%s`
date2=$((date2+86400))
echo "$date1 $date2"
echo "mongodb registerLog loginlog register order baseall"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:\"RegisterLog\",timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:\"LogInLog\",timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:\"Register\",timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:\"TavernBuyGem\",timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:{\$nin:[\"GuildStatistical\",\"GlobalGWRegister\",\"PvPStatistical\",\"GuildTakeShare1\",\"PvPGet\",\"DealCommonSetting\",\"DealShopEdit\",\"GlobalGWMatch\",\"GuildBePermit\",\"GlobalGWReward\",\"LogErr_208\"]},timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"
scp developer@10.2.1.212:/data/apps/infi/log/inn1_$1.log ./
scp developer@10.2.1.213:/data/apps/infi/log/inn2_$1.log ./
echo "baselog all"
grep -vE ",LogOnPre,|,GuildCreate1,|,GuildApply1,|,GuildBePermit,|,GuildExit1,|,GuildCbt1,|,GuildTakeShare1,|,GuildQOpen1,|,GuildQStart1,|,GuildQFinish1,|,GuildQTakeRankRw1,|,GWRegister1,|,GWDefend1,|,GWSupport1,|,GWStart1,|,GWFinish1,|,GWTakeRw1,|,Debug,|,PvPGet,|,LogDiffDay,|,Init,|,HeartBeat,|,RoomAdd,|,StorageAdd,|,StorageRemove,|,SubGemBuy,|,SubGemOther,|,BuyGemBuy,|,BuyGemOther,|,DealCommonSetting,|,DealShopEdit," ./inn1_$1.log ./inn2_$1.log > log_$1.log
cat ./log_$1.log | wc -l