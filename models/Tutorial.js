var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Gallery Model
 * =============
 */

var Tutorial = new keystone.List('Tutorial', {
	map: { name: 'logDate' }
});

Tutorial.add({
	timeStamp:{type:Number,default:0,required:true},
	uid:{type:String,required:true,default:"0"},
	tutorialID:{type:Number,required:true,default:0},
	stage:{type:Types.Select,options:[
		{value:1,label:"start"},
		{value:2,label:"finish"}
		]}
});

Tutorial.schema.post('save', function() {

});

Tutorial.schema.methods.sendNotificationEmail = function(callback) {
	
	var daysleft = this;
	
	keystone.list('User').model.find().where('email', "liangyuanchen@163.com").exec(function(err, admins) {
		
		if (err) return callback(err);
		
		new keystone.Email('daysleft-repertoire').send({
			to: admins,
			from: {
				name: 'innSite',
				email: 'operations@innsite.com'
			},
			subject: 'New tutorial for innSite',
			daysleft: daysleft
		}, callback);
		
	});
	
}
Tutorial.defaultSort = '-logDate';
Tutorial.defaultColumns = 'logDate,tutorialID,stageStartCount,stageFinishCount,conversion,lastconversion';
Tutorial.register();