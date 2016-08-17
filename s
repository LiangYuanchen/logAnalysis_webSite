#!/bin/sh
ps ax | grep node|grep -v grep
ps ax | grep console.sh|grep -v grep
ps ax | grep console_site.sh|grep -v grep
