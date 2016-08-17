#!/bin/sh
./cp_pbfile.sh
topath=/Users/lyuanchen/project/infi-innSite
rsync -avr --exclude node_modules --exclude '*.txt' --exclude serial_no --exclude '*.log' --exclude *.sh --exclude tools ./* $topath
cd ~/project/infi-innSite
git add ./
git commit -m "update innSite"
git pull
git push
