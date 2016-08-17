var keystone = require("keystone"),
	async = require('async'),
	_ = require('underscore'),
	innLog = keystone.list("InnLog"),
	gameUser = keystone.list("GameUser"),
    util = require("util");



var SiteLogManager = function(){

	var self = this;
};
SiteLogManager.prototype.save = function(message,postType,username){
	var sitelog = {postType:postType,message:message,userName:username};
	var sitelog_list = keystone.list("SiteLog");
	var site_save = new sitelog_list.model(sitelog);
	site_save.save(function(){});
}



exports = module.exports = SiteLogManager;