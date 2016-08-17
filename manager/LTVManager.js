var keystone = require("keystone"),
    async = require('async'),
    _ = require('underscore'),
    innLog = keystone.list("InnLog"),
    middleware = require("../routes/middleware");
    innLog_Global = keystone.list("InnLog_Global");
var util = require("util");
var manager = require("./manager");
var _config =keystone.get("_config");
var winston = require('winston');


var ltvManager = function(){
    manager.call(this);
    this.data = {};
    return this;
}
util.inherits(ltvManager,manager);
exports = module.exports = ltvManager;

ltvManager.prototype.process = function (payinfo) {
    var keys = this.getKeys(payinfo);
    _.each(keys, function (key) {
        if(this.data[key])
        {
            this.data[key] += payinfo.money;
        }
        else
        {
            this.data[key] = payinfo.money;
        }
    });
}

ltvManager.prototype.getKeys = function (payinfo) {
    var keys = [];
    var payTime = parseInt(payinfo.innlog.timeStamp) / 1000;
    var regTime = parseInt(payinfo.innlog.userRegTime) / 1000;
    keys.add("" + payTime + "," + regTime + ",all,0");
    keys.add("" + payTime + "," + regTime + "," + payinfo.innlog.country + "," + payinfo.region);

    if(payinfo.innlog.country === "CN")
    {
        keys.add("" + payTime + "," + regTime + ",Not_CN" + "," + payinfo.region);
    }
}

ltvManager.prototype.getObject = function (key) {
    var values = key.split(",");
    var obj = {};
    obj.payTime = parseInt(values[0]);
    obj.regTime = parseInt(values[1]);
    obj.country = values[2];
    obj.region = parseInt(values[3]);
    return obj;
}

ltvManager.prototype.save = function (cb) {
    var keys = _.keys(this.data);
    var self = this;
    _.each(keys, function (key) {
        var obj = self.getObject(key);
        obj.money = self.data[key];
    })
}
