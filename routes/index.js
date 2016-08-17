
var _ = require('underscore'),
    keystone = require('keystone'),
    middleware = require('./middleware'),
    importRoutes = keystone.importer(__dirname);
var serverCpp = require('../ServerCpp');
var configLocal = keystone.get("config_gmtool");
var sitelogManager = require("../manager/siteLogManager");
var _ = require('underscore');
var async    = require('async');
var manager = require("../manager/manager");
var json2csv = require("json2csv");
var HOST = configLocal.host[0];
var PORT = configLocal.port[0];
var utils = require("../manager/util/utils");
var adminUid = configLocal.adminUid;
var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    p = require('protobufjs'),
    server;
var winston = require("winston");

// Common Middleware
keystone.pre('routes', middleware.initLocals);
keystone.pre('render', middleware.flashMessages);
keystone.pre('render',middleware.requireUser);
// Import Route Controllers
var routes = {
    views: importRoutes('./views')
};

// Setup Route Bindings
exports = module.exports = function(app) {
    // Views

    var sitelog = new sitelogManager();

    app.all('/', routes.views.index);
    app.all('/blog/:category?', routes.views.blog);
    app.all('/blog/post/:post', routes.views.post);
    app.all('/gallery', routes.views.gallery);
    app.all('/getInnlog',routes.views.getInnlog);
    app.all('/contact', routes.views.contact);
    app.all('/statistical',routes.views.statistical);
    app.all('/server_status',routes.views.server_status);
    app.all('/phaseStatistical',routes.views.phaseStatistical);
    app.all('/jsonServer',routes.views.jsonServer);
    app.get('/daysLeft',routes.views.daysLeft);
    app.all("/monitoring",routes.views.monitoring);
    app.all("/gmtool/googlebroadcast",routes.views.gmtool_googlebroadcast);
    //app.all('/contact', routes.views.contact);
    app.all("/gameError",routes.views.gameError);
    app.all("/gameUser",routes.views.gameUser);
    app.all("/handle",routes.views.handle);
    app.all("/globalStatistical",routes.views.globalStatistical);
    app.all("/tutorial",routes.views.tutorial);
    app.all("/userStepsTrack",routes.views.userStepsTrack);
    app.all("/userStepsTrack_v2",routes.views.userStepsTrack_v2);
    app.all("/summary",routes.views.summary);
    app.all("/summary_v2",routes.views.summary_v2);
    app.all("/gemStatistical",routes.views.gemStatistical);
    app.get("/gmtool",routes.views.gmtool_login);
    app.get("/gmtool/index?",routes.views.gmtool_index);
    app.get("/gmtool/pvprank",routes.views.gmtool_pvprank);
    app.get("/gmtool/store",routes.views.gmtool_store);
    app.get("/gmtool/mail",routes.views.gmtool_mail);
    app.get("/gmtool/odyssey",routes.views.gmtool_odyssey);
    app.get("/gmtool/dailyreward",routes.views.gmtool_dailyreward);
    app.get("/gmtool/datetime",routes.views.gmtool_datetime);
    app.get("/gmtool/chat",routes.views.gmtool_chat);
    app.all("/goldStatistical",routes.views.goldStatistical);
    app.all("/sweepticket",routes.views.sweepticket);
    app.all("/payinginfo",routes.views.payinginfo);
    app.all("/gmtool/guild",routes.views.gmtool_guild);
    app.all("/feedback",routes.views.userfeedback);
    app.get("/feedbackinfo",routes.views.feedbackinfo);
    app.get("/gmtool/advskill",routes.views.gmtool_advskill);
    app.all("/gmtool/activity",routes.views.gmtool_activity);
    app.all("/appsflyer",routes.views.appsflyer);
    app.all("/gmtool/newsletter",routes.views.gmtool_newsletter);
    app.all("/gmtool/leavemsg",routes.views.gmtool_leavemsg);
    app.all("/gmtool/regionsetting",routes.views.gmtool_region);
    app.all("/gmtool/crontab",routes.views.gmtool_crontab);
    app.all("/gmtool/summonlegend",routes.views.gmtool_summonlegend);
    app.all("/retentions",routes.views.retentions);
    app.all("/validate",routes.views.validate);
    //app.all("/retentions_demo",routes.views.retentions);
    // NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
    // app.get('/protected', middleware.requireUser, routes.views.protected);
    //ServerCpp.connect(PORT,HOST);
    var permission = require("../manager/permission");
    var CanEdit = function(req,permissionName){
        if(req.user&&req.user.code){
             var per = new permission();
             if(per.HasPermisson(permissionName,req.user.code)){
               // console.log("req.url:%s,req.body:%s" ,req.url , req.body);
                sitelog.save(JSON.stringify(req.body),req.url,req.user.email);
                return true;
             }
        }
        return false;
    }
    var all =[];//所有的职业种族组合集合 以 raceid + classid的形式存储
    var SetAll = function(config){
        var races = config.race;
        var classes = config.classe;
        var raceclass = config.raceclass;
        for (var i = raceclass.length - 1; i >= 0; i--) {
            var racename = raceclass[i].race;
            var classname= raceclass[i].class;
            var race= _.findWhere(races,{"text":racename});
            var theclass= _.findWhere(classes,{"text":classname});
            if (race&&theclass) {
                all.push(race.value+""+theclass.value+"");
            }else{
                //console.log("--------------\nSet All has error\nrace:%s\ntheclass:%s\n----------------",race,theclass);
            }
        };
    }

    var config ;
    function getConfig(cb){
        var sc1 = new serverCpp();
        sc1.connect(PORT,HOST,function(){
                try{
                    config = eval('('+sc1.getDataAll()+')') ;
                }
                catch(err){
                    config={};
                    winston.error("getCOnfig error,sc1.getDataAll():%s",JSON.stringify(sc1.getDataAll()));
                    sc1.close();
                    cb();
                    return;
                }
                //获取config
                if(config)
                {
                    SetAll(config);
                }
                sc1.close();
                cb();
         });
        sc1.writeWithCallBack("{\"uid\":\""+adminUid+"\",\"pid\":\"\",\"type\":\"config\",\"cmd\":\"\"}",function(data){
            });

    }

    app.post('/getUserName',function(req,res){
        var uid = req.body.uid;
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"username\",\"cmd\":\"\"}",function(data){
        });
    });
    app.post('/getAdventurers',function(req,res){
        var uid = req.query.uid;
        var type = req.query.type;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"listadv\",\"cmd\":\"\"}",function(data){
        });

    });
    app.post('/deladv',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var instid = req.body.instid;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("opuser,"+uid+",,advdel,"+instid+"",function(data){
        });
    });
    app.post('/getFamiliar',function(req,res){
        var uid = req.query.uid;
        var type = req.query.type;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"familiarlist\",\"cmd\":\"\"}",function(data){
        });
    });

    app.post('/clearAdventurer',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"adventurerclear\",\"cmd\":\"\"}",function(){

        });
    })
    app.post('/clearFamiliar',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"familiarclear\",\"cmd\":\"\"}",function(){
        });
    })
    app.post('/delfamiliar',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var instid = req.body.instid;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("opuser,"+uid+",,familiardel,"+instid+"",function(data){
        });

    });
    app.post('/clearplay',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"clear\",\"cmd\":\"\"}",function(){
        });
    })

    app.post('/editAdventurer',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var data = req.body.data;
        var uid = req.body.uid;
        var type = req.body.type;
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"editadv\",\"cmd\":"+JSON.stringify(data)+"}",function(data){
        });
    })
    app.post('/editFamiliar',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var data = req.body.data;
        var uid = req.body.uid;
        var type = req.body.type;
        var sc  = new serverCpp(PORT,HOST,res);
        var strP = "{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"familiaredit\",\"cmd\":"+JSON.stringify(data)+"}";
        winston.info("editFamiliar %s",strP);
        sc.writeWithCallBack(strP,function(data){
        });
    })
    app.post('/addAdventurers',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var typeid = req.body.typeid;
        var cmd = "";
        if(!isNaN(typeid))
            cmd = typeid;
        else
            cmd = "1:1";
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opuser,"+uid+",,genepvp,"+cmd,function(data){
        });
    });
    app.post('/addFamiliar',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opuser,"+uid+",,familiaradd,1:1",function(data){
        });
    });
    app.post('/userid',function(req,res){
        //console.log(req.body.username + " : "+ req.body.password);
        var name = req.body.username;
        var strP = "opname,,"+name+",userid,1:1";
        var sc = new serverCpp();
        sc.connect(PORT,HOST,function(){
            //console.log(JSON.stringify(arguments));
            //console.log("getuserid:"+sc.getDataAll());
            if (sc.getDataAll()&&sc.getDataAll().length>0) {
                res.send(sc.getDataAll());
            }else if(sc.getDataAll()==null)
            {
                res.send("检查cpp服务器是否正常");
            }
            else if(sc.getDataAll().length==0)
            {
                res.send("该用户名不存在");
            }
            else
            {
                res.send("登陆失败");
            }
        });
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post("/getUserID",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        //console.log(req.body.username + " : "+ req.body.password);
        var name = req.body.username;
        var strP = "opname,,"+name+",userid,0,"+req.body.reg;
        var sc  = new serverCpp(PORT,HOST,res);
        console.log(JSON.stringify(req.body));
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post('/login',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        //console.log(req.body.username + " : "+ req.body.password);
        var name = req.body.username;
        var isfacebook = req.body.isfacebook;
        var reginid = req.body.reg;
        var strP = "opname,,"+name+",userid,"+isfacebook+","+reginid;
        var sc = new serverCpp();
        console.log(JSON.stringify(req.body));
        sc.connect(PORT,HOST,function(){
            //console.log(JSON.stringify(arguments));
            //console.log("getuserid:"+sc.getDataAll());
            if (sc.getDataAll()&&sc.getDataAll().length>0) {
                var indexHost = 1;
                if(req.body.reg)
                    indexHost = parseInt(req.body.reg);
                if(req.query.reg)
                    indexHost = parseInt(req.query.reg);
                res.redirect(configLocal.indexLocation+"?uid="+sc.getDataAll()+"&reg="+indexHost);
            }else if(sc.getDataAll()==null)
            {
                res.send("<script>alert('检查cpp服务器是否正常');history.go(-1);</script>");
            }
            else if(sc.getDataAll().length==0)
            {
                res.send("<script>alert('该用户名不存在');history.go(-1);</script>");
            }
            else
            {
                res.send("<script>alert('登陆失败');history.go(-1);</script>");
            }
        });
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post('/config',function(req,res){
        //console.log("config:"+JSON.stringify(config));
        getConfig(function(){
            res.send(JSON.stringify(config));
        });
    });
    app.post('/getRaceClass',function(req,res){
        //console.log("getRaceClass:"+JSON.stringify(all));
        getConfig(function(){
            res.send(all);
        });
    });

    //备份和战斗记录相关
    app.post('/setrecode',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var strP = "opuser,"+uid+",,setrecode,1:1";
        //console.log('begin setrecode');
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post('/getrecode',function(req,res){
        var uid = req.body.uid;
        var strP = "opuser,"+uid+",,myrecode,1:1";
         var sc  = new serverCpp(PORT,HOST,res,true);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post('/getallrecode',function(req,res){
        var sc = new serverCpp();
        var strP = "opglobal,allrecode,";
        sc.connect(PORT,HOST,function(){
            //console.log('getallrecode');
            var allrecodeStr = sc.getDataAll();
            var result = statInfo(allrecodeStr);
            res.send(result);
            sc.close();
        });
        sc.writeWithCallBack(strP,function(data){});});


    var statInfo = function(allrecode){
        //console.log("allrecode:"+allrecode);
        if (!allrecode) {
            return "";
        };
        var parm = eval('('+allrecode+')');
        var result = [];
        if (parm) {
            for (var i = parm.length - 1; i >= 0; i--) {
                var isContain = false;
                for (var j = result.length - 1; j >= 0; j--) {
                    if (result[j].uid == parm[i].uid) {
                        isContain = true;
                        result[j].count +=1;
                        if (parm[i].result=="0") {
                            result[j].wincount +=1;
                        }
                        break;
                    }
                }
                if (!isContain) {

                    if (parm[i].result=="0") {
                        result.push({uid:parm[i].uid,name:parm[i].name,count:1,wincount:1});
                    }else if(parm[i].result=="1")
                    {
                        result.push({uid:parm[i].uid,name:parm[i].name,count:1,wincount:0});
                    }
                }
            }
        }
        //设置客户端接收json
        var data = {total:result.length,rows:result};
        //console.log("allrecode:"+JSON.stringify(data));
        return data;
    }
    app.post('/getbackuplist',function(req,res){
        var uid  = req.query.uid;
        var strP = "opuser,"+uid+",,backuplist,1:1";
         var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/setbackup',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid  = req.body.uid;
        var cmd = req.body.name+":"+req.body.targetuid;

        var strP = "opuser,"+uid+",,setbackup,"+cmd;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.all('/export',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid  = req.query.uid || req.body.uid;
        var cmd = "1:1";
        var strP = "opuser,"+uid+",,export,"+cmd;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){

        });});
    var getRequest = function(url,paras)
    {
        var paraString = url.split("&");
        var paraObj = {}
        for (i=0; j=paraString[i]; i++){
        paraObj[j.substring(0,j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=")+1,j.length);
        }
        var returnValue = paraObj[paras.toLowerCase()];
        if(typeof(returnValue)=="undefined"){
        return "";
        }else{
        if(returnValue.indexOf('#')>-1)
            returnValue = returnValue.substring(0,returnValue.indexOf('#'));
        return returnValue;
        }        
    }
    function clearFeedbacklist(feedbackiplist)
    {
        var overdue = 60*5;
        var feedbackiplist = keystone.get("feedbackiplist");
        var now = Date.now()/1000;
        _.each(feedbackiplist,function(feedbackip){
            if((now - feedbackip.date) > overdue )
                feedbackip.count = 0;
        });
    }

    function getFeedbacklist()
    {
        return keystone.get("feedbackiplist");
    }

    function saveFeedbacklist(feedbackiplist)
    {
        keystone.set("feedbackiplist",feedbackiplist);
    }

    function getFeedbackByIp(uid)
    {
        var feedbackiplist = keystone.get("feedbackiplist");
        if(!feedbackiplist)
        {
            feedbackiplist = {};
            saveFeedbacklist(feedbackiplist);
        }
            
        if(!feedbackiplist[uid])
        {
            feedbackiplist[uid] = {date:Date.now()/1000};
            saveFeedbacklist(feedbackiplist);
        }
        return feedbackiplist[uid];
    }    

    app.post('/import',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }

        var uid  = req.body.uid;
        var cmd = "1:1";
        var strP = "opuser,"+uid+",,import,"+cmd;
        var sc  = new serverCpp(PORT,HOST,res);
        // sc.writeWithCallBack(strP,function(data){});
        var uploadedfile =req.files.uploadfile;
        var tmppath = uploadedfile.path;
        //console.log("ddd");
        fs.readFile(tmppath,function(err,data){

            winston.debug("the files:%s,body:%s,base64Encode:%s,data:%s",JSON.stringify(req.files),JSON.stringify(req.body),utils.base64encode(data.toString()),data.toString("base64"));
            //var strP = "opuser,"+uid+",,import,"+JSON.stringify(data);
            // var fs = require("fs");
            // var writer =  fs.createWriteStream("./user.data",{
            //   flags:"w",
            //   defaultEncoding: 'binary',
            //   fd: null,
            //   mode:0o666
            // });
            // writer.write(data);
            // writer.end();
            var strP = "opuser,"+uid+",,import,"+data.toString("base64");
            var sc  = new serverCpp(PORT,HOST,res);

            sc.write(strP);
            fs.unlinkSync(tmppath);
        });
    });



    app.post('/getallbackup',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid  = req.body.uid;
        var cmd = req.body.name+":"+req.body.targetuid;

        var strP = "opuser,"+uid+",,getallbackup,"+cmd;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/getbackup',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid  = req.body.uid;
        var cmd = req.body.cmd;

        var strP = "opuser,"+uid+",,getbackup,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});

    app.post('/user',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = "1:1";

        var strP = "opuser,"+uid+",,user,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/globaluser',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = req.body.cmd;

        var strP = "opglobal,globaluser,"+uid+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/clearrecode',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;

        var strP = "opglobal,clearrecode,"+uid+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/clearmyrecode',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;

        var strP = "opuser,"+uid+",,clearmyrecode,"+uid+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/clearbackup',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = "1:1";

        var strP = "opuser,"+uid+",,clearbackup,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/tavernshow',function(req,res){
        if(!CanEdit(req,"summary")){
            res.send("");
            return;
        }
        var uid = req.query.uid;
        var cmd = "1:1";
        var sc = new serverCpp();
        var strP = "opuser,"+uid+",,tavernlist,"+cmd+"";
        sc.connect(PORT,HOST,function(){
            //console.log('tavernlist');
            var data = null;
            var result = {total:0,rows:[]};
            if(sc.getDataAll()){
                console.log(sc.getDataAll());
                var data =eval("(" + sc.getDataAll() + ")");

                result.total = 11;

                var format = "yyyy/MM/dd hh:mm:ss";
                function formatDate(val,row)
                {
                    if(isNaN(val))
                        {
                            val = row.begindate = Date.parse(val);
                        }
                        return (new Date(parseInt(val))).format("yyyy-MM-dd hh:mm:ss");
                }
                result.rows = [
                    {"name":"ID","value":data.id,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"Name","value":data.name,"group":"酒馆基本信息","editor":"text"},
                    {"name":"Level","value":data.level,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"GemBuy","value":data.gembuy,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"GemOther","value":data.gemother,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"QueenCoin","value":data.queencoin,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"Exp","value":data.exp,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"Energy","value":data.energy,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"Coin","value":data.coin,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"Reputation","value":data.reputation,"group":"冒险者基本信息","editor":"numberbox"},
                    {"name":"Fame","value":data.fame,"group":"冒险者基本信息","editor":"numberbox"},
                    {"name":"OdysseyCoin","value":data.odysseycoin,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"PvPCoin","value":data.pvpcoin,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"SweepTicket","value":data.sweepticket,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"VipLevel","value":data.viplevel,"group":"酒馆基本信息"},
                    {"name":"GemBuyTotal","value":data.gembuytotal,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"GuildCoin","value":data.guildcost,"group":"酒馆基本信息","editor":"numberbox"},
                    {"name":"MCard","value":new Date(data.mcard*1000).format(format),"group":"酒馆基本信息",formatter:formatDate,"editor":"datetimebox"},
                    {"name":"SeniorMCard","value":new Date(data.senior*1000).format(format),"group":"酒馆基本信息",formatter:formatDate,"editor":"datetimebox"},
                    {"name":"PvPCount","value":data.pvpcount,"group":"PvP基本信息","editor":"numberbox"},
                    {"name":"PvPScore","value":data.pvpscore,"group":"PvP基本信息","editor":"numberbox"},
                    {"name":"ClientDate","value":new Date(data.userdate*1000).format(format),"group":"用户信息"},
                    {"name":"ServerDate","value":new Date( data.serverdate*1000).format(format),"group":"用户信息"},
                    {"name":"RegisterDate","value":new Date(data.register*1000).format(format),"group":"用户信息"},
                    {"name":"SeeAllServers","value":data.seeall,"group":"用户信息","editor":"numberbox"},
                    {"name":"Pid2","value":data.pid2,"group":"用户信息"},
                    {"name":"Bindmepid","value":data.bindmepid,"group":"用户信息"},

                    {"name":"Region","value":data.region,"group":"用户信息"},
                    {"name":"GuildId","value":data.guildid,"group":"公会基本信息","editor":"numberbox"},
                    {"name":"GuildPlayCount","value":data.guildplaycount,"group":"公会基本信息","editor":"numberbox"},
                    {"name":"GuildCtbCountToday","value":data.guildctbcounttoday,"group":"公会基本信息","editor":"numberbox"},
                    {"name":"GuildTakeShareToday","value":data.guildtakesharetoday,"group":"公会基本信息","editor":"numberbox"},
                    {"name":"GuildExitDate","value":new Date(data.guildexitdate*1000).format(format),"group":"公会基本信息",formatter:formatDate,"editor":"datetimebox"},
                    {"name":"BanLoginTime","value":new Date(data.banlogintime*1000).format(format),"group":"GMTOOL",formatter:formatDate,"editor":"datetimebox"},
                    {"name":"DisChatTime","value":new Date(data.dischattime*1000).format(format),"group":"GMTOOL",formatter:formatDate,"editor":"datetimebox"}
                ];
                console.log("tavernshow.data:"+JSON.stringify(data));
                ////console.log("tavernshow:"+data.id);
            }
            res.send(result);
            sc.close();
        });
        sc.writeWithCallBack(strP,function(data){});});
var editTavern = function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var sc  = new serverCpp(PORT,HOST,res);
        var cmd = {};
        var datas = req.body.data;
        cmd.name = datas.Name;
        cmd.id = datas.ID;
        cmd.level = datas.Level;
        cmd.gembuy = datas.GemBuy;
        cmd.gemother = datas.GemOther;
        cmd.queencoin = datas.QueenCoin;
        cmd.exp = datas.Exp;
        cmd.energy = datas.Energy;
        cmd.coin = datas.Coin;
        cmd.reputation = datas.Reputation;
        cmd.fame = datas.Fame;
        cmd.odysseycoin = datas.OdysseyCoin;
        cmd.pvpcoin = datas.PvPCoin;
        cmd.sweepticket = datas.SweepTicket;
        cmd.gembuytotal = datas.GemBuyTotal;
        cmd.pvpcount = datas.PvPCount;
        cmd.pvpscore = datas.PvPScore;
        cmd.mcard =datas.MCard;
        cmd.seeall = datas.SeeAllServers;
        cmd.guildcoin = datas.GuildCoin;
        cmd.guildplaycount = datas.GuildPlayCount;
        cmd.guildctbcounttoday = datas.GuildCtbCountToday;
        cmd.guildtakesharetoday = datas.GuildTakeShareToday;
        cmd.guildexitdate = datas.GuildExitDate;
        cmd.guildid = datas.GuildId;
        cmd.senior = datas.SeniorMCard;

        cmd.pid2 = datas.Pid2 || "none";
        cmd.bindmepid = datas.Bindmepid || "none";
        cmd.inviterfb = datas.InviterFb || "";

        cmd = JSON.stringify(cmd);

        console.log(JSON.stringify(req.body));
        //var strP  = "{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"tavernedit\",\"cmd\":"+cmd+"}";
        var strP = "opuser,"+uid+",,tavernedit,"+cmd;
        ////console.log("tavernedit.body:"+JSON.stringify(req.body));

      //  console.log("tavernedit.edit:"+strP);

        sc.writeWithCallBack(strP,function(data){});
}
    app.post("/tavernedit2",function(req,res){
        editTavern(req,res);
    });
    app.post('/tavernedit',function(req,res){
        editTavern(req,res);
    });
    app.post('/tavernclear',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = "1:1";

        var strP = "opuser,"+uid+",,tavernclear,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    //
    app.post('/storagelist',function(req,res){
        var uid = req.query.uid;
        var cmd = req.query.category;
        var sc = new serverCpp();
        var strP = "opuser,"+uid+",,storagelist,"+cmd+"";
        sc.connect(PORT,HOST,function(){
            ////console.log('storagelist: strP:'+strP);
            var result = sc.getDataAll();
            if (result) {
                result = eval("("+result+")");
                var data ={};
                if (result) {
                    for (var i = result.length - 1; i >= 0; i--) {
                        if( result[i].items)
                            result[i].items =JSON.stringify( result[i].items);
                    };
                    data.total = result.length;
                    data.rows = result;
                }
                else{
                    data = null;
                }
               // //console.log("storageList:%s", JSON.stringify(data));
                res.send(data);
            }else{
                var data = {};
                data.total = 0;
                data.rows = [];
                res.send(eval(data));
            }
            sc.close();
        });
        sc.writeWithCallBack(strP,function(data){});});

    app.post('/storageedit',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var category= req.body.category;
        var parm = req.body.data;
        var data = {};
        data = parm;
        var cmd = JSON.stringify(data);

        //var strP = "opuser,"+uid+",,storageedit,"+cmd+"";
        var strP = "{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"storageedit\",\"cmd\":"+cmd+"}";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});

    app.post("/storagedel",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = req.body.tid;

        var strP = "opuser,"+uid+",,storagedel,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});


    app.post('/equipedit',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var category= req.body.category;
        var parm = req.body.data;
        var data = {};
        data = parm;
        if (data) {
            for (var i = data.length - 1; i >= 0; i--) {
                if(data[i].items)
                {
                    data[i].items = eval("("+data[i].items+")");
                }
            };
        }else{
            console.log(new Date()+"#equipedit data is null.");
        }
        var cmd = JSON.stringify(data);
        //console.log("data:%s",cmd);
        var strP = "opuser,"+uid+",,equipedit,"+cmd+"";
        var strP = "{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"equipedit\",\"cmd\":"+cmd+"}";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/storageclear',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = "1:1";

        var strP = "opuser,"+uid+",,storageclear,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/equipremove',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = JSON.stringify(req.body);

        var strP = "opuser,"+uid+",,equipclear,"+cmd+"";
        console.log(strP);
       // var strP = "{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"equipclear\",\"cmd\":"+cmd+"}";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    app.post('/resetQuest',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = "1:1";

        var strP = "opuser,"+uid+",,questreset,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});});
    //quest
    app.post('/questlist',function(req,res){
        var uid = req.query.uid;
        var cmd = "1:1";
        var strP = "opuser,"+uid+",,questlist,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res,true);
        sc.writeWithCallBack(strP,function(data){


        });
    });
    app.post('/questedit',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid =req.body.uid;
        var data = req.body.data;
        if ((!data)||(!data.length)) {
            res.send("quest is null!");
            return;
        };
        for (var i =   data.length - 1; i >= 0; i--) {;
            var row =  data[i];
            if(row.lastplaytime){
                if (isNaN(row.lastplaytime)) {
                    row.lastplaytime = ((new Date(row.lastplaytime)).getTime())/1000;
                }
            }
            if (row.starttime) {
                if(isNaN(row.starttime)){
                    row.starttime = ((new Date(row.starttime)).getTime())/1000;
                }
            }
        }
        cmd  = JSON.stringify(data);
        //console.log("cmd:"+cmd)
        var strP = "{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"questedit\",\"cmd\":"+cmd+"}";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post('/questclear',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var data = req.body.data;
        cmd = "1:1";
        var strP = "opuser,"+uid+",,questclear,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post('/questdel',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = req.body.cmd;
        var strP = "opuser,"+uid+",,questdel,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post('/unlockchapter',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        cmd = "1:1";
        var strP = "opuser,"+uid+",,unlockchapter,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post('/dishend',function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        cmd = "";
        var strP = "opuser,"+uid+",,dishend,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    // test
    app.post('/test_pvprecodelist',function(req,res){
        var uid = req.body.uid;
        cmd = uid;
        var strP = "opglobal,recodecalculatelist,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post('/test_simulatepvp',function(req,res){
        if(!CanEdit(req,"pvprank")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var opponentuid = req.body.opponentuid;
        var result = req.body.result;
        var parm = {};
        parm.uid = uid;
        parm.opponentuid = opponentuid;
        parm.result = result;
        var cmd = JSON.stringify(parm);
        var strP = "opglobal,recodecalculate,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post("/clearAllRecode",function(req,res){
        if(!CanEdit(req,"pvprank")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var opponentuid = req.body.opponentuid;
        var result = req.body.result;
        var parm = {};
        parm.uid = uid;
        parm.opponentuid = opponentuid;
        parm.result = result;
        var cmd = JSON.stringify(parm);
        var strP = "opglobal,clearrecode,0";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});

    });

    app.post("/changestaticvalue",function(req,res){
        if(!CanEdit(req,"pvprank")){
            res.send("");
            return;
        }
        var scoreA = req.body.scoreA;
        var scoreB = req.body.scoreB;
        var result = req.body.result;
        var parm = {};
        parm.scoreA = scoreA;
        parm.scoreB = scoreB;
        parm.result = result;
        var cmd = JSON.stringify(parm);
        var strP = "opglobal,changestaticvalue,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});

    });

    app.all("/tasklist",function(req,res){
        var uid = req.query.uid;
        var cmd = "1:1";
        var strP = "opuser,"+uid+",,tasklist,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res,true);
        sc.writeWithCallBack(strP,function(data){});
    });

    app.post("/taskedit",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid =req.body.uid;
        var data = req.body.data;
        cmd  = JSON.stringify(data);
        //console.log("cmd:"+cmd)
        var strP = "{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"taskedit\",\"cmd\":"+cmd+"}";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });

    app.post("/taskclear",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var data = req.body.data;
        cmd = "1:1";
        var strP = "opuser,"+uid+",,taskclear,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post("/editpvp",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid =req.body.uid;
        var data = req.body.data;
        if(!data)
            data=[];
        cmd  = JSON.stringify(data);

        var strP = "{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"pvpedit\",\"cmd\":"+cmd+"}";
        console.log("data:"+JSON.stringify(data));
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.post("/addAllAdv",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opuser,"+uid+",,addalladv,1:1",function(data){
        });
    });
    app.post("/addotheradvs",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = req.body.cmd;

        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opuser,"+uid+",,allotheradvs,"+cmd+"",function(data){
        });
    });
    app.post("/addallfamiliars",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opuser,"+uid+",,allfamiliars,1:1",function(data){
        });
    });
    //pvpRank
    app.all("/ranktypelist",function(req,res){
        var uid = req.query.uid;
        var cmd = "1:1";
        var strP = "opglobal,ranktypelist,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.all("/ranklist",function(req,res){
        var uid = req.query.uid;
        var cmd = req.body.data;
        var strP = "opglobal,ranklist,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res,true);
        sc.writeWithCallBack(strP,function(data){});
    });
    app.all("/rankgroup",function(req,res){
        var uid = req.query.uid;
        var cmd = req.body.data;
        console.log("rankgroup");
        var strP = "opglobal,rankgroup,"+cmd+"";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
            console.log("rankgroup over,data:%s",JSON.stringify(data));
        });
    });
    app.get("/AllDebug",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.query.uid;
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opuser,"+uid+",,alldebug,1:1",function(data){
        });
    });
    app.post("/tutoriallist",function(req,res){
        var uid = req.query.uid;
        var sc  = new serverCpp(PORT,HOST,res,true);
        sc.writeWithCallBack("opuser,"+uid+",,tutoriallist,1:1",function(data){
        });
    });
    app.post("/tutorialedit",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = req.body.data;
        cmd = JSON.stringify(cmd);
        //console.log(cmd);

        var sc  = new serverCpp(PORT,HOST,res);
        var strP = "{\"uid\":\""+uid+"\",\"pid\":\"\",\"type\":\"tutorialedit\",\"cmd\":"+cmd+"}";
        winston.debug(strP);
        sc.writeWithCallBack(strP,function(data){
        });
    });
    app.post("/tutorialclear",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opuser,"+uid+",,tutorialclear,1:1",function(data){
        });
    });
    app.post("/tutorialdel",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = req.body.cmd;
        if (!cmd || cmd.length == 0) {
            cmd = 0;
        };
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opuser,"+uid+",,tutorialdel,"+cmd+"",function(data){
        });
    });
    app.post("/storelist",function(req,res){
        var cmd = req.body.data;
        var sc  = new serverCpp(PORT,HOST,res,true);
        var region = req.body.region;
        sc.writeWithCallBack("opglobal,storelist,"+cmd+":"+region,function(data){
        });
    });
    app.post("/storeedit",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var sc  = new serverCpp(PORT,HOST,res);
        var cmd = {};
        cmd.data = req.body.data;
        cmd.shoptype = req.body.shoptype;
        cmd.region = req.body.region;
        sc.writeWithCallBack("opglobal,storeedit,"+JSON.stringify(cmd),function(data){
        });
    });
    app.post("/storeclear",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var region = req.body.region;
        var sc  = new serverCpp(PORT,HOST,res);
        var strP = "opglobal,storeclear,"+cmd+":"+region;
        console.log("storeclear,strP:%s",strP);
        sc.writeWithCallBack(strP,function(data){
        });
    });
    app.post("/storedelete",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var region = req.body.region;
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opglobal,storedel,"+cmd+":"+region,function(data){
        });
    });
    app.post("/storepool",function(req,res){
        var cmd = "1:1";
        var sc  = new serverCpp(PORT,HOST,res);

        sc.writeWithCallBack("opglobal,storepool,"+cmd,function(data){
        });
    });
    app.post("/mailadd",function(req,res){
        if(!CanEdit(req,"mail")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var sc  = new serverCpp(PORT,HOST,res);
        console.log(JSON.stringify(cmd));
        sc.writeWithCallBack("opglobal,mailadd,"+JSON.stringify(cmd),function(data){
        });
    })
    app.post("/mailsendcountry",function(req,res){
         if(!CanEdit(req,"mail")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        cmd.sendtype="32";
        if((cmd.country&&cmd.country.length>0)||cmd.ne_country)
        {
            var sql = {};
            var datenow = (new Date())/1000 - 86400*2;
            sql.lastlogtime = {$gte:datenow};
            
            if(cmd.ne_country)
            {
                sql.country = {$nin:cmd.ne_country.split(",")};
            }
            else
            {
                sql.country = {$in:cmd.country.split(",")};
            }
            winston.info("mailsendcountry ,sql:%s",JSON.stringify(sql));
            keystone.list("GameUser").model.find(sql).distinct("uid").exec(function(err,results){
                var strArr = [];
                var i = 0;
                var maxLimit=10;
                async.whilst(
                    function(){ return i<results.length },
                    function(callback){
                        var parm = results[i];
                        var j = 0;
                        cmd.uid = [];
                       
                        while(j<=3000&&i<results.length)
                        {
                            cmd.uid.push(results[i]);
                            i++;
                            j++;
                        }
                        cmd.uid = cmd.uid.join(",");
                        var strMl = "opglobal,mailadd,"+JSON.stringify(cmd);

                        winston.debug("mailsendcountry:%s",strMl);
                        var sc  = new serverCpp(PORT,HOST,res);
                        sc.writeWithCallBack(strMl,function(data){
                            callback();
                        });
                    },
                    function(err){
                });
            });  
        }
        

    });            
    app.post("/mailsendall",function(req,res){
         if(!CanEdit(req,"mail")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        cmd.sendtype="32";
        var sql = {};
        sql.uid ={$in:["435183266804205","542875276784168","344757025354521","786988332876958","552315614900918","617242635404672","587770569819450","569130411754876","362770118193638","673738635216185","744313537824270","797029966415580","350005475390452","749450318709885","803017150825973","435363655431181","456589383807928","523058297681055","611513149032251","445276439950515","740078700070145","608111534933274","341063353480006","347067717759895","807389427532966","670740748044102","833494238758221","532721974096417","527714042229425","437030102742265","566931388499059","788036304897549","570436081812657","597700534208038","326666623103922","404422711030299","297795852940238","733627659192410","362452290614680","450585019528597","620798868325656","380516923060932","483604728099856","455275123815090","617612002592226","812019402277998","802759452787856","561111707923157","776500022740465","821382430983256","352728484656407","614029999868030","583879329449325","770066161730889","419420736828321","438267053323098","456331685729694","611530328901264","813505460963277","508635797500634","713484262573284","517242911962184","797854600136061","547934748258893","297744313332446","695462579800046","843767800530122","628839047103747","706105508758973","618127398667819","677921933362445","718062697711828","761570716419863","543090025149306","602863084897407","783844416816447","744871883573491","814149706057403","788671960057078","766724677174510","769413326702250","541724225549732","536235257344673","553028579471909","398959512629824","603713488422179","711268059449009","696785429726893","775735518561790","558457418134549","593680444818687","690239899568493","516194939941610","336965954680184","490236157605531","543914658869901","695557069080643","410109247730552","326099687421450","464071216838025","830058264921661","364342076225124","703150571259684","618513945724069","594273150305946","535591012250385","629131104880048","679708639757389","755196984951942","726996229686619","504684427588327","680043647206975","540951131436670","392663090573902","333418311693192","637626550192499","754819027830655","731651974235593","294918224852128","742681450251354","712745528198936","468915939947901","465686124541524","560613491717282","424634827125938","626493994960906","363723600934314","476569571668465","347050537890322","535522292774580","628186212075400","628418140309125","766312360313970","578330231703031","781800012383492","526142084200015","636441139217719","603155142674359","777925951883257","689260647025037","477265356370579","797785880659096","494677153788932","592022587442350","486112989000293","332147001373205","317810400539617","668215307273363","295433620927307","550082231907720","643235777480462","501849749173876","518479862543465","576320187008137"]};
        sql.uid = {$in:["452766862874012","625291404117175"]};
        
        winston.info("mailsendall ,sql:%s",JSON.stringify(sql));
        keystone.list("GameUser").model.find(sql).distinct("uid").exec(function(err,results){
            var strArr = [];
            var i = 0;
            var maxLimit=10;
            async.whilst(
                function(){ return i<results.length },
                function(callback){
                    var parm = results[i];
                    var j = 0;
                    cmd.uid = [];
                   
                    while(j<=3000&&i<results.length)
                    {
                        cmd.uid.push(results[i]);
                        i++;
                        j++;
                    }
                    cmd.uid = cmd.uid.join(",");
                    var strMl = "opglobal,mailadd,"+JSON.stringify(cmd);

                    winston.debug("mailsendall:%s",strMl);
                    var sc  = new serverCpp(PORT,HOST,res);
                    sc.writeWithCallBack(strMl,function(data){
                        callback();
                    });
                },
                function(err){
            });
        });  
        
    });
    app.post("/maillist",function(req,res){
        var cmd = "1:1";
        console.log("pending it");
        var sc  = new serverCpp(PORT,HOST,res,true);
        sc.writeWithCallBack("opglobal,maillist,"+JSON.stringify(cmd),function(data){
            console.log("pending it over");
        });
    });
    app.post("/maildel",function(req,res){
        if(!CanEdit(req,"mail")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("opglobal,maildel,"+cmd,function(data){
        });
    })
    app.post("/mailclear",function(req,res){
        if(!CanEdit(req,"mail")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("opglobal,mailclear,1:1",function(data){
        });
    })

    app.post("/test",function(req,res){

    });

    app.post("/odyssey",function(req,res){
        if(!CanEdit(req,"odyssey")){
            res.send("");
            return;
        }
        var cmd = req.body.count;
        if (isNaN(cmd)) {
            cmd = 0;
        };
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("rduser,"+cmd,function(data){
        });
    });
    app.post("/resetodyssey",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var sc = new serverCpp(PORT,HOST,res);
        var str = "opuser,"+uid+",,resetodyssey,1:1"+"";
        sc.writeWithCallBack(str,function(data){

        });
    });
    app.all("/upclientversion",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var version = req.body.version+"";
        version = version.replace(/,/g,":");
        var version_type =req.body.version_type;
        if(!version||version.length==0)
        {
            res.send("<script>alert('version是空！！！');history.go(-1)</script>");
            return;
        }
        var updateIt = function(i,cb){
             var p = configLocal.port[i];
             var h = configLocal.host[i];
             var sc  = new serverCpp(p,h,res);
             sc.writeWithCallBack("upclientversion,"+version+","+version_type,function(data){
                if(++i<configLocal.host.length)
                {
                    updateIt(i,cb);
                }
                else
                    cb();
            });
        };

        var parm_type = version +","+ version_type;
        var parm_name = JSON.stringify(req.user.name);
        var old_parm_type = keystone.get("version_version_type");
        var old_parm_name = keystone.get("version_name");
        console.log("old_parm_name:%s,old_parm_type:%s,parm_name:%s,parm_type:%s",old_parm_name,old_parm_type,parm_name,parm_type);
        if(old_parm_name&&old_parm_type&&parm_name!=old_parm_name&&old_parm_type==parm_type)
        {
            updateIt(0,function(){
                keystone.set("version_name","");
                keystone.set("version_version_type","");                
                res.send("<script>window.location.href='/gmtool'</script>");
            });
        }
        else
        {
            keystone.set("version_name",parm_name);
            keystone.set("version_version_type",parm_type);
            res.send("<script>window.location.href='/gmtool'</script>");
        }




    })
    app.all("/getclientversion",function(req,res){
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("upclientversion",function(data){

        });
    });

    app.post("/dailyrwlist",function(req,res){
        var sc  = new serverCpp(PORT,HOST,res,true);
        var cmd = req.body.region;
        sc.writeWithCallBack("opglobal,dailyrwlist,"+cmd,function(data){

        });
    });
    app.post("/dailyrwedit",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var sc  = new serverCpp(PORT,HOST,res);
        var cmd=req.body;
        cmd = JSON.stringify(cmd);
        var strP = "{\"uid\":\"\",\"pid\":\"\",\"type\":\"dailyrwedit\",\"cmd\":"+cmd+"}";
        sc.writeWithCallBack(strP,function(data){

        });
    });
    app.post("/dailyrwdelete",function(req,res){
        if(!CanEdit(req,"dailyreward")){
            res.send("");
            return;
        }
        var sc  = new serverCpp(PORT,HOST,res);
        var cmd=req.body;
        cmd = JSON.stringify(cmd);
        
         var strP ="opglobal,dailyrwdelete,"+JSON.stringify(cmd);
        sc.writeWithCallBack(strP,function(data){

        });
    });
    app.post("/dailyrwclear",function(req,res){
        if(!CanEdit(req,"dailyreward")){
            res.send("");
            return;
        }
        var cmd=req.body;
         var strP ="opglobal,dailyrwclear,"+JSON.stringify(cmd);

        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){

        });
    });
    app.post("/serverdate",function(req,res){
        if(!CanEdit(req,"datetime")){
            res.send("");
            return;
        }
        var cmd=req.body.date;
        var strP = "settime,"+cmd+",1";
         var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){

        });
    });
    app.post("/clientdate",function(req,res){
        if(!CanEdit(req,"datetime")){
            res.send("");
            return;
        }
        var cmd=req.body.date;
        var uid=req.body.uid;
        var strP = "setusertime,"+uid+","+cmd;
         var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){

        });

    });
    app.post("/timenow",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
         var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("opglobal,timenow,1:1",function(data){

        });
    });
    app.post("/getclienttime",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = "1:1";
         var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack("opuser,"+uid+",,getclienttime,"+cmd+"",function(data){

        });
    });
    app.post("/sendchat",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = {};
        cmd = req.body.cmd;
         var sc  = new serverCpp(PORT,HOST,res);
         var strP = "{\"uid\":\"\",\"pid\":\"\",\"type\":\"sendchat\",\"cmd\":"+JSON.stringify(cmd)+"}";
        sc.writeWithCallBack(strP,function(data){

        });
    });
    app.post("/logindiffday",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = "1:1";
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        var strP ="opuser,"+uid+",,logindiffday,"+cmd+"";
        sc.writeWithCallBack(strP,function(data){

        });
    });
    app.post("/dailyrwbaselist",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var cmd = "1:1";
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        var strP ="opglobal,dailyrwbaselist,"+cmd+"";
        sc.writeWithCallBack(strP,function(data){

        });
    });

    app.post("/pvpreset",function(req,res){
        //var uid = req.body.uid;
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = "1:1";
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        var strP ="opglobal,pvpreset,"+cmd+"";
        sc.writeWithCallBack(strP,function(data){

        });
    });


    app.post("/pvpsave",function(req,res){
        //var uid = req.body.uid;
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = "1:1";
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        var strP ="opglobal,pvpsave,"+cmd+"";
        sc.writeWithCallBack(strP,function(data){

        });
    });
    app.post("/googlebroadcast_send",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }

        //var uid = req.body.uid;
        var cmd = req.body.cmd;
        try{
            var objcmd = JSON.parse(cmd);
            var errMsg = "";
            if(!objcmd)
                errMsg+="cmd is not a object\n";
            if(!objcmd.to&&!objcmd.registration_ids)
                errMsg+="gtype err\n";
            if(!objcmd.data)
                errMsg+="objcmd.data err\n";
            if(!objcmd.data.message)
                errMsg+="objcmd.data.message err\n";
            if(!objcmd.data.title)
                errMsg+="objcmd.data.title err\n";
            if(!objcmd.data.type||!(objcmd.data.type==2000))
                errMsg+="objcmd.data.type err\n";

            if(errMsg.length>0)
            {
                winston.error("googlebroadcast_send validation error,%s,cmd:%s",errMsg,cmd);
                res.send(errMsg);
                return;
            }

            }
        catch(err){
            winston.error(err,cmd);
            res.send("");
            return;
        }

        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        var strP ="opglobal,googlebroadcast,"+cmd+"";
        sc.writeWithCallBack(strP,function(data){
        });
    });
    app.post("/googlebroadcast_remove",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        require('cron');
        var uid = req.body.uid;
        var _id =req.body._id;
        var crons = keystone.get("cronTabs");
        // var self = this;
        var keys= _.keys(crons);

        if(crons&&crons[_id])
        {
        winston.info("crons ids:%s,_id:%s,crons.length:%d",JSON.stringify(keys),_id,crons.length);

            crons[_id].stop();
            crons[_id]=null;
        }
        else
        {
            winston.debug("remove stop failure");
        }
        keystone.set("cronTabs",crons);

        keystone.list("CronTab").model.findOne({_id:_id}).remove(function(){
            winston.info("over removeCron,%s",_id);
            res.send("removeCron:"+_id);
        });

    });
    app.post("/googlebroadcast_cronlist",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        //var uid = req.body.uid;
        keystone.list("CronTab").model.find({}).sort({timeStamp:-1}).exec(function(err,results){
            var datas={};
            datas.total = results.length;
            var rows = [];
            _.each(results,function(parm){
                var row = {};
                row._id=parm._id;
                row.cron=parm.cron;
                row.cmd =parm.cmd;
                row.onServer=parm.onServer;
                row.begindate=parm.begindate;
                row.remark = parm.remark;
                row.tType = parm.tType;
                rows.push(row);
            });
            datas.rows=rows;
            winston.debug("cronlist:%s",datas);
            res.send(datas);
        });
    });
    app.post("/googlebroadcast_cronedit",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        //var uid = req.body.uid;
        var data = req.body.data;
        winston.debug("editcron:%s",JSON.stringify(data));
        _.each(data,function(parm){
            if(parm._id)
            {
                keystone.list("CronTab").model.findOne({_id:parm._id}).exec(function(err,result){
                    result.cmd = parm.cmd;
                    result.cron = parm.cron;
                    result.begindate = parm.begindate;
                    result.tType = parm.tType;
                    result.remark = parm.remark;
                    result.save(function(err){
                        winston.debug("saved CronTab:%s",JSON.stringify(result),err);
                    })//pre.save更新计划任务
                });
            }
            else
            {
                var newone={cmd:parm.cmd,cron:parm.cron,begindate:parm.begindate,tType:parm.tType,remark:parm.remark};
                var CronTabModel = keystone.list("CronTab").model;
                var newCron = new CronTabModel(newone);
                newCron.save(function(err){
                    winston.debug("saved CronTab:%s",JSON.stringify(newCron),err);
                });
            }
        });
        res.send("");
    });
     app.post("/update2global",function(req,res){
        var uid = req.body.uid;
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.type || 0;
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        var strP ="opuser,"+uid+",,update2global,"+cmd+"";
        sc.writeWithCallBack(strP,function(data){

        });
    });
    app.post("/unlockskill",function(req,res){
        var uid = req.body.uid;
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.instid;
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "unlockskill,"+uid+",,1:1";
        var strP ="opuser,"+uid+",,unlockskill,"+cmd+"";
        sc.writeWithCallBack(strP,function(data){

        });
    });
    app.post("/getregion",function(req,res){
        //var uid = req.body.uid;
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = "1:1";
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        var strP ="opglobal,getregion,"+cmd+"";
        sc.writeWithCallBack(strP,function(data){
        });
    });
    app.post("/guildlist",function(req,res){
        //var uid = req.body.uid;
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var guildId = req.body.guildid;
        var region = req.body.region;
        var point = req.body.point;
        var cmd = _.pick(req.body,"guildid","region","point");
        //cmd = JSON.stringify(req.body);
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        var strP ="opglobal,guildlist,1:1";

        sc.writeWithCallBack(strP,function(data){
        });
    });
    app.post("/guildselect",function(req,res){
         //var uid = req.body.uid;
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var guildId = req.body.guildid;
        var region = req.body.region;
        var cmd = _.pick(req.body,"guildid","region");
        cmd = JSON.stringify(req.body);
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        winston.debug(JSON.stringify(cmd));
        var strP ="opglobal,guildselect,"+cmd+"";
        // var theInterFace = require("../manager/Interfaceprotobuf");
        // interF = new theInterFace();

        sc.writeWithCallBack(strP,function(data){
        });
    });
    app.post("/newoutsideadv",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var strP ="opuser,"+uid+",,newoutsideadv,1:1";

        // var sc  = new serverCpp(PORT,HOST,res);
        // sc.writeWithCallBack(strP,function(data){
        // });
    });
     app.post("/advskilllist",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var uid = req.body.uid;
        var instid = req.body.instid;
        var strP ="opuser,"+uid+",,advskilllist,"+instid;

        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
    });
     app.post("/editadvskilllist",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var uid = req.body.uid;
        var strP ="opuser,"+uid+",,editadvskilllist,"+JSON.stringify(cmd);

        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/delfacebookbind",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var uid = req.body.uid;
        var strP ="opuser,"+uid+",,delfacebookbind,1:1";

        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/guildwaronoff",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,guildwaronoff,"+cmd;

        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/guildwar",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,guildwar,"+cmd;

        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/guildwarround",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var strP ="opglobal,guildwarround,1:1";

        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
    app.post("/guildedit",function(req,res){
        //var uid = req.body.uid;
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var editType = req.body.edittype;
        var cmd = {};
        switch(parseInt(editType))
        {
            case 1:
                cmd = req.body;
            break;
            case 2:
                cmd.members = req.body.data;
                cmd.guildid = req.body.guildid;
                cmd.region = req.body.region;
            case 3:
                cmd = req.body;
                break;
            case 5:
                cmd = req.body;
                _.each(cmd.data,function(row){
                    if(row.finishedonce == "true")
                        row.finishedonce = true;
                    else
                        row.finishedonce = false;
                })
            default:
                cmd = req.body;
            break;
        }
        cmd.edittype = editType;
        cmd = JSON.stringify(cmd);
        var sc  = new serverCpp(PORT,HOST,res);
        //var strP = "logindiffday,"+uid+",1:1";
        var strP ="opglobal,guildedit,"+cmd+"";
        winston.debug(JSON.stringify(cmd));
        sc.writeWithCallBack(strP,function(data){
        });
    });
     app.post("/commonsettinglist",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.region || 0;
        var strP ="opglobal,commonsettinglist," + cmd;

        var sc  = new serverCpp(PORT,HOST,res);
        winston.info("commonsettinglist:%s",strP);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/commonsettingedit",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,commonsettingedit,"+JSON.stringify(cmd);
        console.log("strP:%s",strP);
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/commonsettingclear",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,commonsettingclear,1:1";

        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/newsletteredit",function(req,res){
        if(!CanEdit(req,"mail")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,newsletteredit,"+JSON.stringify(cmd);
        console.log("newsletteredit,strP:%s",strP);
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/newsletterlist",function(req,res){
        if(!CanEdit(req,"mail")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,newsletterlist," + cmd;

        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/newsletterdel",function(req,res){
        if(!CanEdit(req,"mail")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,newsletterdel,"+JSON.stringify(cmd);
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/changebanlogintime",function( req, res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.date;
        var uid = req.body.uid;
        var strP = "opuser,"+uid+",,changebanlogintime,"+cmd;
        var sc = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/editdischat", function( req, res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.date;
        var uid = req.body.uid;
        var strP = "opuser,"+uid+",,editdischat," + cmd;
        var sc = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){

        });
     });
     app.post("/leavemsglist",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,leavemsglist,"+cmd;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/leavemsgedit",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        _.each(cmd,function(ldata){
            ldata.time = (new Date(ldata.time))/1000 + "";
        });
        var strP ="opglobal,leavemsgedit,"+JSON.stringify(cmd);
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/leavemsgadd",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,leavemsgadd,"+JSON.stringify(cmd);
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/clearfb",function(req,res){
       debugger;
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = "1:1";
        var strP ="clearfb,"+cmd;
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/regionsettinglist",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = "1:1";
        var strP ="opglobal,regionsettinglist,"+JSON.stringify(cmd);
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/regionsettingedit",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,regionsettingedit,"+JSON.stringify(cmd);
        winston.info("regionsettingedit:%s",strP);
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
	app.post("/summonlegendlist",function(req,res){
		if(!CanEdit(req,"user")){
			res.send("");
			return;
		}
		var cmd = "1:1";
		var strP ="opglobal,summonlegendlist,"+cmd;
		var sc  = new serverCpp(PORT,HOST,res);
		sc.writeWithCallBack(strP,function(data){
		});
	});
	app.post("/summonlegendedit",function(req,res){
		if(!CanEdit(req,"user")){
			res.send("");
			return;
		}
		var cmd = req.body.data;
		var strP ="opglobal,summonlegendedit,"+JSON.stringify(cmd);
		winston.info("summonlegendedit:%s",strP);
		var sc  = new serverCpp(PORT,HOST,res);
		sc.writeWithCallBack(strP,function(data){
		});
	});
     app.post("/regionmerge",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,regionmerge,"+cmd;
        winston.info("regionmerge:%s",strP);
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/regionmergelist",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var cmd = req.body.data;
        var strP ="opglobal,regionmergelist,"+JSON.stringify(cmd);
        winston.info("regionmergelist:%s",strP);
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/getallpayinginfos",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        var parm = req.body;
        var q = keystone.list("PayingInfo").model;
        if(parm&&parm.uid&&parm.uid.length>0)
          {   
              q= q.find({"uid":parm.uid});
          }
        else
            q=q.find();
        if(parm&&parm.region!="0")
          q=q.where("region",{$in:utils.strArr2intArr(parm.region)});

        console.log(q._conditions);
        q = q.populate("gamer innlog");
         q = q.exec(function(err,datas){
            if(err){
                console.error(err);
            };
            var results = [];
            _.each(datas,function(data){
                var a = {};
                a.timeStamp = data.timeStamp;
                a.orderId = data.orderId;
                a.gem = data.gem;
                a.money = data.money;
                a.uid = data.uid;
                a.region = data.region;
                debugger;
                if(data.gamer&&data.gamer.country)
                a.country = data.gamer.country;
                if(data.gamer&&data.gamer.device_id)
                a.device_id = data.gamer.device_id;
                if(data.gamer&&data.gamer.registerdate)
                a.registerdate = data.gamer.registerdate;
                results.push(a);
            });
            var fields = ["orderId","gem","money","timeStamp","uid","registerdate","region","country","device_id"];
            try {
              var result = json2csv({ data: results, fields: fields });
              res.contentType("application/CSV")
              res.send(result);
            } catch (err) {
              // Errors are thrown for bad options, or if the data is empty and no fields are provided. 
              // Be sure to provide fields if it is possible that your data array will be empty. 
              console.error(err);
            }            
        });    
     });
     app.post("/reloadconfig",function(req,res){
        if(!CanEdit(req,"user")){
            res.send("");
            return;
        }
        
        var strP ="reloadconfig";
        var sc  = new serverCpp(PORT,HOST,res);
        sc.writeWithCallBack(strP,function(data){
        });
     });
     app.post("/client_version",function(req,res){
        var exec = require('child_process').exec; 
        var cmdStr = "elinks -dump 0 'https://play.google.com/store/apps/details?id=com.seagame.innfinity' |grep -A1 'Current Version'";
        exec(cmdStr, function(err,stdout,stderr){
            if(err) {
                res.send('api error:'+stderr);
                res.close();
            } else {
                res.send(stdout);
                res.close();
            }
        });        
     });
};
