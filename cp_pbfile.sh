rm -rf ./pbfiles/*.proto ./pbfiles/GameConfig
cp -r ../../client/pbfiles ./
cp ../../client/Resources/GameConfig ./pbfiles
rm ./pbfiles/common/dbinterface.proto 
cp ../trunk/ProtoMessage/baseproto/dbinterface.proto ./pbfiles/common/ 
