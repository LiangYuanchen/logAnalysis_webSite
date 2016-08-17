#!/bin/sh
./innlogscount.exp $1
scp ssh3:~/count ./count1
scp ssh4:~/count ./count2
count1=`cat count1`
count2=`cat count2`
echo $(($count1+$count2)) > count

