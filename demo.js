var express = require('express');
var publicPath = __dirname + '/public';

var app = express();
app.listen(3001,function()
	{
		console.log("listening on port 3000");
	});
app.use(function(req,res,next){
	res.redirect(301,"http://101.200.171.121:3000");
	res.end();
	next();
});