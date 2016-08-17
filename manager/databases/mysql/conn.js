var   async = require('async'),
    _ = require('underscore'),
    fs = require('fs'),
    async = require('async');
var keystone = require('keystone');
var  _config = keystone.get("_config");
var winston = require("winston");
var utils = require("../../util/utils");
var mysql = require("mysql");
require("../../util/datetime");

var pool;
var saved = 0;

var conn = function()
{
	this.strSql = [];
}
exports = module.exports = conn;
if(!pool)
{
	if(_config.mysql.isopen)
	{
		pool = mysql.createPool({
			  connectionLimit : 1900,
			  host            : _config.mysql.host,
			  user            : _config.mysql.user,
			  password        : _config.mysql.password
		});
		pool.on('connection', function (connection) {
		  //connection.query('SET SESSION auto_increment_increment=1')
		});		
		pool.on('enqueue', function () {
		  winston.info('Waiting for available connection slot on mysql');
		});		
	}
}
conn.prototype.deleteByCrt_DT = function(timeStamp,table,cb){
	var database = _config.mysql.database;
	var sql = "delete from `"+ database + "`.`" + table +"` where date(Crt_DT)=\""+new Date(timeStamp*1000).format("yyyy-MM-dd")+"\" ";
	pool.query(sql,function(err, rows, fields){
		utils.showErr(err);
		if(err)
			winston.info("rows:%s,err:%s,fields:%s,strObj:%s",JSON.stringify(rows),JSON.stringify(err),JSON.stringify(fields),sql);
		cb();		
	});
}
conn.prototype.deleteAll = function(table,cb){
	var database = _config.mysql.database;
	var sql = "delete from `"+ database + "`.`" + table +"` ";
	pool.query(sql,function(err, rows, fields){
		utils.showErr(err);
		if(err)
			winston.info("rows:%s,err:%s,fields:%s,strObj:%s",JSON.stringify(rows),JSON.stringify(err),JSON.stringify(fields),sql);
		cb();		
	});	
}
conn.prototype.deleteLessDate = function(timeStamp,table,cb){
	var database = _config.mysql.database;
	var sql = "delete from `"+ database + "`.`" + table +"` where date(Crt_DT)<\""+new Date(timeStamp*1000).format("yyyy-MM-dd")+"\" ";
	pool.query(sql,function(err, rows, fields){
		utils.showErr(err);
		if(err)
			winston.info("rows:%s,err:%s,fields:%s,strObj:%s",JSON.stringify(rows),JSON.stringify(err),JSON.stringify(fields),sql);
		cb();
	});	
}
conn.prototype.saveMysql = function(obj,table,cb)
{
	var strObj = "";
	var nameStr = "";
	var valueStr = "";
	var database = _config.mysql.database;
	var keys = _.keys(obj);
	_.each(keys,function(key){
		var objValue = obj[key];
		if(typeof objValue == "string")
			objValue = objValue.replace(/\"/g,"\\\"");
		nameStr += "`" + key + "`,";
		valueStr += "\""+ objValue+ "\",";
	})
	nameStr = nameStr.substring(0,nameStr.length - 1);
	valueStr = valueStr.substring(0,valueStr.length - 1);
	strObj = "insert into `"+database+"`.`" + table + "` (";
	strObj += nameStr;
	strObj += ") values (";
	strObj += valueStr;
	strObj += ");";

	pool.query(strObj,function(err, rows, fields){
		utils.showErr(err);
		if(err)
			winston.info("rows:%s,err:%s,fields:%s,strObj:%s",JSON.stringify(rows),JSON.stringify(err),JSON.stringify(fields),strObj);
		//else
		//{
			//saved++;
			//winston.info("mysql saved:%s",saved);
			//winston.info("rows:%s,err:%s,fields:%s,strObj:%s",JSON.stringify(rows),JSON.stringify(err),JSON.stringify(fields),strObj);
		//}	
		cb();
	});
}
conn.prototype.saveObj = function(obj,table,cb){
	async.waterfall([
		function(thecb)
		{
			var valueStr = "";

			var keys = _.keys(obj);
			_.each(keys,function(key){
				if(typeof obj[key] == "string")
					valueStr += "\""+ obj[key] + "\",";
				else
					valueStr += obj[key] + ",";
			});
			valueStr = valueStr.substring(0,valueStr.length - 1);
			thecb(null,valueStr);
		},
		function(valueStr,thecb){
			var foldername = "./ipo_dumps/" + (new Date(obj.created_at)).format("yyyyMMdd") + "/";
			var filename = table + ".txt";		
			fs.exists(foldername,function(exists){
				if(exists)
					thecb(null,valueStr,foldername,filename);
				else
				{
					fs.mkdir(foldername,0744,function(err){
						utils.showErr(err);
						thecb(null,valueStr,foldername,filename);
					});
				}
			});
		},
		function(valueStr,foldername,filename,thecb){
			if(!obj.server_id)
			{
				thecb();
				return;
			}
			foldername = foldername + "infiniteinn#" + obj.server_id +"#" + (new Date(obj.created_at)).format("yyyyMMdd") +  "/";
			fs.exists(foldername,function(exists){
				if(exists)
					thecb(null,valueStr,foldername,filename);
				else
				{
					fs.mkdir(foldername,0744,function(err){
						utils.showErr(err);
						thecb(null,valueStr,foldername,filename);
					});
				}
			});				
		},
		function(valueStr,foldername,filename,thecb){
			
			fs.appendFile(foldername+filename,valueStr + "\n",function(){
				thecb();
			});			
		}
		],function(err){
			
			cb();
	});
	
}

conn.prototype.getCount = function (table, date, cb) {
	var dateBegin = (new Date(date * 1000)).format();
	var dateEnd = (new Date((date + 24 * 60 * 60 - 1) * 1000)).format();
	var database = _config.mysql.database;
	var queryStr = "select count(*) from `" + database + "`.`" + table + "` where Crt_DT BETWEEN '" + dateBegin + "' AND '" + dateEnd + "';";
	winston.info("queryStr:" + queryStr);
	pool.query(queryStr, function(err, rows, fields) {
		var count = 0;
		if(err)
			winston.info("rows:%s,err:%s,fields:%s",JSON.stringify(rows),JSON.stringify(err),JSON.stringify(fields));
		else
			count = rows[0]["count(*)"];
		winston.info("count:" + count);
		cb(count);
	});
}
