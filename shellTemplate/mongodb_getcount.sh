#!/bin/sh
date1=`date -d "$1" +%s`
date2=$((date1+86400))
echo "$date1 $date2"
mongo innsite --eval "db.auth(\"analyzer\",\"vT554Ewe\");db.innlogs.find({logType:{\$nin:[\"GuildStatistical\",\"GlobalGWRegister\",\"PvPStatistical\",\"GuildTakeShare1\",\"PvPGet\",\"DealCommonSetting\",\"DealShopEdit\",\"GlobalGWMatch\",\"GuildBePermit\",\"GlobalGWReward\",\"LogErr_208\",\"GMOperate\"]},timeStamp:{\$gte:$date1,\$lt:$date2}}).count()"
scp developer@10.2.1.212:/data/apps/infi/log/inn1_$1.log ./
scp developer@10.2.1.213:/data/apps/infi/log/inn2_$1.log ./
grep -vE ",LogOnPre,|,GuildCreate1,|,GuildApply1,|,GuildBePermit,|,GuildExit1,|,GuildCbt1,|,GuildTakeShare1,|,GuildQOpen1,|,GuildQStart1,|,GuildQFinish1,|,GuildQTakeRankRw1,|,GWRegister1,|,GWDefend1,|,GWSupport1,|,GWStart1,|,GWFinish1,|,GWTakeRw1,|,Debug,|,PvPGet,|,LogDiffDay,|,Init,|,HeartBeat,|,RoomAdd,|,StorageAdd,|,StorageRemove,|,SubGemBuy,|,SubGemOther,|,BuyGemBuy,|,BuyGemOther,|,DealCommonSetting,|,DealShopEdit," ./inn1_$1.log ./inn2_$1.log > log_$1.log
cat ./log_$1.log | wc -l