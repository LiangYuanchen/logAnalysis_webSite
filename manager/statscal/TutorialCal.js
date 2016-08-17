var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    util = require('util'),
    utils = require("../util/utils");
var winston = require('../util/LogsBackup');
var BaseCal = require("./BaseCal");
var TutorialCal = function (handle) {
    BaseCal.call(this,handle);
    this.CalType = "TutorialCal";
    this.tutorials = {};
}
util.inherits(TutorialCal,BaseCal);
exports = module.exports = TutorialCal;

/////////////////////
TutorialCal.prototype.process = function(log, options)
{
    var self = this;
    //winston.info("StatsCal");
    if(log.logType != "Tutorial" && log.logType != "QuestFinish")
        return;
    var arrStr = log.message.split(",");
    if(log.logType=="Tutorial"&&log.message.indexOf("f,")>=0)
    {
        var tutorial = {};
        tutorial.tutorialId = arrStr[1] || "";
        tutorial.timeStamp = log.timeStamp;

        if(!self.tutorials[log.uid])
            self.tutorials[log.uid] = [];
        self.tutorials[log.uid].push(tutorial);
    }
    if(log.logType == "QuestFinish")
    {
        var finishType = arrStr[1];
        var typeid = arrStr[0];
        if(finishType!="0")
        {
            return;
        }
        var tutorial = {};
        tutorial.tutorialId = typeid || "";
        tutorial.timeStamp = log.timeStamp;
        if(!self.tutorials[log.uid])
            self.tutorials[log.uid] = [];
        self.tutorials[log.uid].push(tutorial);

    }
}
//需要检查下如果那个冒险者没有的话的情况
TutorialCal.prototype.save = function(stats,next){
    var self = this;
    var uids = _.keys(self.tutorials);
    async.waterfall([
        function(cb){
            keystone.list("GameUser").model.find({uid:{$in:uids}}).exec(function(err,results){
                if(err)
                {
                    winston.error("#tutorialCal# error 1");
                    utils.showErr(err);    
                }
                cb(err,results);
            });
        },
        function(users,cb){
            var i = 0;
            if(!users || users.length==0)
            {
                cb();
                return;
            }
            async.whilst(
                function(){
                    return i<users.length;
                },
                function(callback){
                    var theuser = users[i];
                    // if(!user.uid)
                    // {
                    //     winston.error("the user has not uid , user:%s",JSON.stringify(user));
                    //     i++;
                    //     callback();
                    //     return;
                    // }
                    //检查是否有重复tutoiral
                    if(!theuser.tutorials)
                        theuser.tutorials = [];                
                    var demotutorials = [];
                    var repeated_id = [];
                    _.each(theuser.tutorials,function(tutorial){
                        if(!_.contains(repeated_id,tutorial.tutorialId))
                        {
                            repeated_id.push(tutorial.tutorialId);
                            demotutorials.push(tutorial);
                        }
                    });
                    theuser.tutorials = demotutorials;

                    var arrTutorials = self.tutorials[theuser.uid];
                    _.each(arrTutorials,function(tutorial){
                        var thistutorial = _.find(theuser.tutorials,function(t_tutorial){ return t_tutorial.tutorialId == tutorial.tutorialId});
                        if(!thistutorial)
                        {
                            theuser.tutorials.push(tutorial);
                        }
                        else if(thistutorial.timeStamp > tutorial.timeStamp)
                        {
                            var arrTu = _.clone(theuser.tutorials);

                            theuser.tutorials=[];
                            for(var i = 0;i<arrTu.length;i++)
                            {
                                if(arrTu[i].tutorialId == thistutorial.tutorialId)
                                    continue;
                                else
                                    theuser.tutorials.push(arrTu[i]);
                            }
                            theuser.tutorials.push(tutorial);
                        }
                    });
                    theuser.markModified("tutorials");
                    theuser.save(function(){
                        i++;
                        callback();
                    });
                },
                function(err){
                    cb();
                }
            );
        }
        ],function(err,results){
            next();
    });
}

