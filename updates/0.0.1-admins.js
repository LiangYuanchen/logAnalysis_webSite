/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 */

exports.create = {
	User: [
		{ 'name.first': 'Admin', 'name.last': 'User', email: 'liangyuanchen@163.com', password: 'xingyunsu', isAdmin: true }
	]
};

/**
 * The following is the older version of this update script, it is
 * left here for reference as an example of how more complex updates
 * can be structured.
 */

var keystone = require('keystone'),
	async = require('async'),
	User = keystone.list('User'),
	InnLog = keystone.list('InnLog');

var admins = [
	{ email: 'haogang.chen@nebuliumgames.com', password: 'nebul1umgames', name: { first: 'Haogang', last: 'Chen' } ,isAdmin:false,code:2046},
	{ email: 'qu.chen@nebuliumgames.com', password: 'nebul1umgames', name: { first: 'Qu', last: 'Chen' } ,isAdmin:false,code:2046},
	{ email: 'maomao.li@nebuliumgames.com', password: 'nebul1umgames', name: { first: 'Maomao', last: 'Li' },isAdmin:false,code:2046 },
	{ email: 'liangyuanchen@163.com', password: 'xingyunsu', name: { first: 'Yuanchen', last: 'Liang' },isAdmin:true,code:2046 },
	{ email: 'wenliang.tao@nebuliumgames.com', password: 'xingyunsu', name: { first: 'wenliang', last: 'tao' },isAdmin:false,code:2046 },
	{ email: 'chao.han@nebuliumgames.com', password: 'xingyunsu', name: { first: 'chao', last: 'han' },isAdmin:false,code:2046 },
	{ email: 'zhen.cao@nebuliumgames.com', password: 'xingyunsu', name: { first: 'zhen', last: 'cao' },isAdmin:false,code:2046 },
	{ email: 'jia.qiao@nebuliumgames.com', password: 'xingyunsu', name: { first: 'jia', last: 'qiao' },isAdmin:false,code:2046 },
	{ email: 'licheng@nibirutech.com', password: 'xingyunsu', name: { first: 'seagame', last: '' },isAdmin:false,code:0 },
	{ email: 'licheng@nibirutech.com', password: 'xingyunsu', name: { first: 'seagame', last: '' },isAdmin:false,code:0 },
	{ email: 'yuxin.chang@nebuliumgames.com', password: 'xingyunsu', name: { first: 'yuxin', last: 'chang' },isAdmin:false,code:2046 },
	{ email: 'test1@test1.com', password: 'xingyunsu', name: { first: 'test1', last: 'test1' },isAdmin:false,code:0 },
	{ email: 'test2@test2.com', password: 'xingyunsu', name: { first: 'test2', last: 'test2' },isAdmin:false,code:0 },
	{ email: 'test2@test2.com', password: 'xingyunsu', name: { first: 'test2', last: 'test2' },isAdmin:false,code:0 },
	{ email: 'luyu.yang@nebuliumgames.com', password: 'xingyunsu', name: { first: 'luyu', last: 'yang' },isAdmin:false,code:2046 },
	{ email: 'zaibao.yuan@nebuliumgames.com', password: 'xingyunsu', name: { first: 'zaibao', last: 'yuan' },isAdmin:false,code:2046 },
	{ email: 'yipeng.zhang@nebuliumgames.com', password: 'xingyunsu', name: { first: 'zaibao', last: 'yuan' },isAdmin:false,code:2046 }
];
var innlogs = [
	//{"message" : "a", "category" : "0", "power" : "0", "gold" : "0", "gem" : "0", "innExp" : "0", "innLevel" : "0", "logType_large" : "unknown", "userRegTime" : "1411383414156", "uid" : "0", "gameid" : "0", "timeStamp" : "0", "logDate" : "2014-09-21T16:00:00Z", "R1" : "1", "R2" : "1", "R3" : "1" }
	//{"logDate":"2014-09-22 19:08:59","timeStamp":"1411384139","gameid":"1","uid":"436544772112770","userRegTime":"1411367207","logType_large":"LogOut","innLevel":"1","innExp":"0","gem":"0","gold":"20000","power":"100","category":"common","R1":"R1","R2":"R2","R3":"R3","message":","}
];
function createGameUser(){
	var getRegister = function(err,results){
		for (var i = results.length - 1; i >= 0; i--) {
				var parm ={};
				parm.uid=results[i].uid;
				parm.username=results[i].mseeage.split(",")[0];
				parm.userRegTime=results[i].userRegTime;
				parm.innExp=results[i].innExp;
				parm.gem=results[i].gem;
				parm.gold=results[i].gold;
				parm.power=results[i].power;
				parm.lastlogtime=results[i].timeStamp;
				parm.lastlogdate=new Date(parm.lastlogtime*1000);
				parm.activetime=0;
				var userData = new keystone.List("GameUser").model(parm);
				userData.save(function(err){
					if (err) {
						console.error(JSON.stringify(err));
					};
				});
			};	
	};	
	var q = keystone.list("InnLog").model.find().where("logType","Register").exec(getRegister);
}
function createAdmin(admin, done) {
	
	var newAdmin = new User.model(admin);
	
	newAdmin.isAdmin = true;
	newAdmin.save(function(err) {
		if (err) {
			console.error("Error adding admin " + admin.email + " to the database:");
			console.error(err);
		} else {
			console.log("Added admin " + admin.email + " to the database.");
		}
		done(err);
	});
	
}
function createInnLog(innlog,done)
{
	var newInnlog = new InnLog.model(innlog);
	
	newInnlog.save(function(err) {
		if (err) {
			console.error("Error adding innLog " + newInnlog.message + " to the database:");
			console.error(err);
		} else {
			console.log("Added innLog " + newInnlog.mseeage + " to the database.");
		}
		done(err);
	});
}
exports = module.exports = function(done) {
	async.forEach(admins, createAdmin, done);
	async.forEach(innlogs,createInnLog,done);
	//createGameUser();
	console.log("updates");
};

