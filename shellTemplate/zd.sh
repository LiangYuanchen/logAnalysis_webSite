#!/bin/sh
(
sleep 10;
echo 'opglobal,commonsettingedit,{"sevendays":{"open":"true"},"accumulatebuygem":{"open":"true","start":"1450483200","end":"1450656000"},"boxshop":{"open":"true","start":"1449792000","end":"1449964800"},"discountshop":{"open":"true","start":"1450396800","end":"1450656000"},"bindfb":{"open":"true"},"followfb":{"open":"true"}}'
)|telnet 192.168.31.100 2014
