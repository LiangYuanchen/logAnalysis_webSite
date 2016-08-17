 #!/bin/sh
 datex=`date -d "$1" +%Y_%m_%d`
 date1=`date -d "$1" +%s`
 date2=$((date1+86400))
 collections="gameusers_$datex"
 echo "$date1 $date2 $collections"
 mongo innsite --eval "var parmA=db.gameusers.find({\$or:[{registerdate:{\$gte:$date1,\$lt:$date2}},{lastlogtime:{\$gte:$date1,\$lt:$date2}}]});while(parmA.hasNext())db.$collections.insert(parmA.next())"