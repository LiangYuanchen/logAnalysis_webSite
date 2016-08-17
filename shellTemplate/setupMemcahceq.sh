#!/bin/sh
tar -xzf ./memcacheq_dev.tar.bz2 

tar -xzf ./db-4.7.25.tar.gz
cd db-4.7.25/
cd build_unix/
../dist/configure
make
sudo make install

cd ../../

tar -xzf ./libevent-1.4.14b-stable.tar.gz
cd libevent-1.4.14b-stable 
./configure
make
sudo make install

cd ../

tar -xzf ./memcacheq-0.2.1.tar.gz
cd memcacheq-0.2.1
./configure --enable-threads
make
sudo make install