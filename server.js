	var keystone = require('keystone');
	var _ = require("underscore");
	var hexy = require("hexy");
	var async = require('async');
	var isDebug = false;
	var mail_test = false;
	var _config = keystone.get("_config");
	var winston = require('./manager/util/LogsBackup');
	var innlogManager = require("./manager/innlogManager");
	var gameUserManager = require("./manager/gameUserManager");
	var innlogHandler = require("./manager/innlogHandle");
	var serverCpp = require('./ServerCpp');
	var net = require('net');
	//var HOST = '127.0.0.1';
	var PORT = 0,PORT_GLOBAL = 0;
	var isTest=_config.isTest;
	PORT = _config.innSite.portLog;
	PORT_GLOBAL = _config.innSite.portGlobal;
	var serverCpp_games = [null,null];
	var serverCpp_others = [null,null];
	var serverCpp_bases = [null,null];
	var serverCpp_cal =[null,null];
	var serverCpp_cplusplus=[null,null];
	var GetserverCpp_cplusplus=function(index,buffer,next){
		var sock = "";
		if(serverCpp_cplusplus[index])
		{
			sock = serverCpp_cplusplus[index];
		}
		else
		{
			sock = new net.Socket();
			// sock.setTimeout(0);
			// sock.setNoDelay(true);
		    sock.connect({
		            host:_config.innSite.ipCplusplus,
		            port:_config.innSite.portCplusplus
		        }, function() {
		    });	
		    sock.on('close', function() {
		        console.log('Connection closed');
		        serverCpp_cplusplus[index] = null;
		        sock.destroy();
		        sock = null;
		    });
		    sock.on('error', function(err) {
		    	console.log("cal connected error,err:%s",JSON.stringify(err));
		    });
		    sock.on("data", function(data){
		    	console.log('connnection recevied');
		    });

		    serverCpp_cplusplus[index] = sock;
		}
		if(buffer&&buffer.length>0)
			sock.write(buffer,next);
		else
			winston.error("#GetserverCpp_cplusplus# error");
	}
	var GetserverCpp_base = function(index,buffer,next){
		var sock = "";

		if(serverCpp_bases[index])
		{
			sock = serverCpp_bases[index];
		}
		else
		{
			sock = new net.Socket();
			// sock.setTimeout(0);
			// sock.setNoDelay(true);
		    sock.connect({
		            host:_config.innSite.ipBase,
		            port:_config.innSite.portBase
		        }, function() {

		    });	
		    sock.on('close', function() {
		        console.log('Connection closed');
		        serverCpp_bases[index] = null;
		        sock.destroy();
		    });
		    sock.on('error', function(err) {
		    	console.log("base connected error,err:%s",JSON.stringify(err)); 
		    });
		    sock.on("data", function(data){
		    	console.log('connnection recevied');
		    });
		    serverCpp_bases[index] = sock;
		}
		if(buffer&&buffer.length>0)
			sock.write(buffer,next);
		else
			winston.error("#GetserverCpp_base# error");		
	}
	var GetserverCpp_cal = function(index,buffer,next){
		var sock = "";
		if(serverCpp_cal[index])
		{
			sock = serverCpp_cal[index];
		}
		else
		{
			sock = new net.Socket();
			// sock.setTimeout(0);
			// sock.setNoDelay(true);
		    sock.connect({
		            host:_config.innSite.ipCalculate,
		            port:_config.innSite.portCalculate
		        }, function() {
		    });	
		    sock.on('close', function() {
		        console.log('Connection closed');
		        serverCpp_cal[index] = null;
		    });
		    sock.on('error', function(err) {
		    	console.log("cal connected error,err:%s",JSON.stringify(err));
		    });
		    sock.on("data", function(data){
		    	console.log('connnection recevied');
		    });

		    serverCpp_cal[index] = sock;
		}
		if(buffer&&buffer.length>0)
			sock.write(buffer,next);
		else
			winston.error("#GetserverCpp_cal# error");		
	}
	var GetserverCpp_base = function(index,buffer,next){
		var sock = "";

		if(serverCpp_bases[index])
		{
			sock = serverCpp_bases[index];
		}
		else
		{
			sock = new net.Socket();
			// sock.setTimeout(0);
			// sock.setNoDelay(true);
		    sock.connect({
		            host:_config.innSite.ipBase,
		            port:_config.innSite.portBase
		        }, function() {

		    });	
		    sock.on('close', function() {
		        console.log('Connection closed');
		        serverCpp_bases[index] = null;
		        sock.destroy();
		    });
		    sock.on('error', function(err) {
		    	console.log("base connected error,err:%s",JSON.stringify(err));
		    });
		    sock.on("data", function(data){
		    	console.log('connnection recevied');
		    });

		    serverCpp_bases[index] = sock;
		}
		if(buffer&&buffer.length>0)
			sock.write(buffer,next);
		else
			winston.error("#GetserverCpp_base# error");		
	}

	var GetserverCpp_game = function(index,buffer,next){
		var sock = "";
		if(serverCpp_games[index])
		{
			sock = serverCpp_games[index];
		}
		else
		{
			sock = new net.Socket();
			sock.setTimeout(0);
			sock.setNoDelay(true);
		    sock.connect({
		            host:_config.innSite.ipGame,
		            port:_config.innSite.portGame
		        }, function() {
		        //console.log(net._createServerHandle);
		        //console.log('CONNECTED TO: ' + host + ':' + port);
		       	//console.log('local address:'+ JSON.stringify(self.client.address()));

		        //console.log('local port:' + client.localPort);
		        // this.client.setTimeout(5000,function(){
		        //     console.log("超时关闭连接");
		        //     this.client.destroy();
		        // });
		        // 建立连接后立即向服务器发送数据，服务器将收到这些数据

		        
		        //sock.pipe(sock);
		        //sock.destroy();
		    });	
		    sock.on('close', function() {
		        //console.log('Connection closed');
		        serverCpp_games[index] = null;
		        sock.destroy();
   		        
		    });
		    sock.on('error', function(err) {
		    	console.log("gamed connected error,err:%s",JSON.stringify(err));
		    });
		    sock.on("data", function(data){
		    	console.log('connnection recevied');
		    });
		    serverCpp_games[index] = sock;
		}
		if(buffer&&buffer.length>0)
			sock.write(buffer,next);
		else
			winston.error("#GetserverCpp_game# error");		
		
	}

	
	var GetserverCpp_other = function(index,buffer,next){
		var sock = "";
		if(serverCpp_others[index])
		{
			sock = serverCpp_others[index];
		}
		else
		{
			sock = new net.Socket();
			sock.setTimeout(0);
			sock.setNoDelay(true);
		    sock.connect({
		            host:_config.innSite.ipOther,
		            port:_config.innSite.portOther
		        }, function() {

		    });	
		    sock.on('close', function() {
		        //console.log('Connection closed');
		        serverCpp_others[index] = null;
		        sock.destroy();
		        
		    });
		    sock.on('error', function(err) {
		    	console.log("other connected error,err:%s",JSON.stringify(err));
		    });
		    sock.on("data", function(data){
		    	console.log('connnection recevied');
		    });
		    serverCpp_others[index] = sock;
		}
		if(buffer&&buffer.length>0)
			sock.write(buffer,next);
		else
			winston.error("#GetserverCpp_other# error");		
	}

	//数据接收和innlog存储帮助类
	var buffer = [];
		lengthOffset   = 0;
		currentLen = 0;
		count  = 0;
		offset = 0;
	var tcpsession = function(){
		    this.buffer = [],
			this.lengthOffset   = 0,
			this.currentLen = 0,
			this.count  = 0,
			this.offset = 0;
			this.ip     = "";
			this.port   = 0;
	};
	tcpsession.prototype.ip = "";
	tcpsession.prototype.port = 0;
	tcpsession.prototype.offset = 0;
	tcpsession.prototype.count = 0;
	tcpsession.prototype.currentLen = 0;
	tcpsession.prototype.lengthOffset = 0;
	tcpsession.prototype.buffer = [];
	var validate = function(ip,port){
		var hascontain = false;
		for (var i = sessions.length - 1; i >= 0; i--) {
			var a= sessions[i];
			if(a.ip == ip && a.port == port){
				hascontain =  true;
				break;
			}
		};
		return hascontain;
	}
	var sessions = [];
	var insertGlobalLog = function(msg){
		if(msg)
		{
			var innGlobalLog = keystone.list("InnLog_Global");
			msg.logDate = Date.now()/1000;
			var newGLog = new innGlobalLog.model(msg);
			newGLog.save(function(err){
				if (err) {
					console.log("Error adding innGlobalLog " +newGLog.gameid+"/"+ newGLog.online +"/"+newGLog.userCount+ " to the database:");
					console.log(err);
				} else {
					//console.log(JSON.stringify(msg));
					//console.log("["+Date.now()+"]Added innGlobalLog " +newGLog.gameid+"/"+ newGLog.online +"/"+newGLog.userCount+" to the database.");
				}
			}); 
		}
	}


	var globalResult ={};
	var read_global_cb = function(data){
		
		if (data.length==0|| !!data==false) {
			return;
		};
		var finishIt = false;
		//console.log("Global");
		//console.log("data:"+data);
		parms = data.toString().split("\n");
		//console.log("data parm:"+parms);
		for (var i=0;i<parms.length;i++) {
			var p = parms[i].split(":");
			if(p){
				global_cb(p,globalResult);
			}
		};
	}
	var global_cb = function(parm,globalResult){
		if (parm[0]=="total") {
			globalResult.userCount = parm[1];
		}
		else if(parm[0]=="swap")
			globalResult.swap = parm[1];
		else if(parm[0]=="mem")
		{
			var used =parseFloat(parm[1]);
			var free =parseFloat(parm[2]);
			globalResult.mem_idle = (free/(used+free))*100;
			//console.log(used+":"+free+":"+globalResult.mem_idle);
		}
		else if(parm[0]=="disk")
			globalResult.disk_idle = parm[1];
		else if(parm[0]=="upspeed")
			globalResult.upspeed = parm[1];
		else if(parm[0]=="downspeed")
			globalResult.downspeed = parm[1];
		else if(parm[0]=="average_int")
			globalResult.average_int = parm[1];
		else if(parm[0]=="cpu_idle")
			globalResult.cpu_idle = parm[1];
		else if(parm[0]=="online"){
			globalResult.gameid = parm[1];
			globalResult.online = parm[2];
			globalResult.tag    = parm[3];	
			insertGlobalLog(globalResult);
			globalResult = {};
		}
	}
	//验证心跳包
	var validateKa = function(data){
		var kCount = 0;
		if (data.length==6) {
			//console.log("-------------"+data);count = count | (data[offset] << (lengthOffset * 8));
			kCount = data[0] | (data[1]<<8) |  data[2]<<16 | data[3]<<24;
			//console.log("-------------kCount"+kCount);
			if (kCount==2) {
				var strData = data[4] + data[5];
				//console.log("-------------strData:"+strData);
				if (strData=="ka") {
					return false;
				};
			};
		};
		return true;
	}
	var index_test=0;
	//var lastRigthMsg = null;
	var term_1 = 0;
	var term_2 = 0;
	var isError = false;

	var ishexy = false;
	var read_cb_while_world = function(data,index){
		if(isNaN(index))
		{
			winston.error("#server#read_cb_while_world error,index isNaN,index:%s,data.hexy:%s,data:%s",index,hexy.hexy(data),data.toString());
		}
	 	GetserverCpp_base(index,data,function(){});
	 	GetserverCpp_game(index,data,function(){});
	 	if(_config.title.indexOf("live")>-1)
	 		GetserverCpp_other(index,data,function(){});
	 	//GetserverCpp_cplusplus(index,data,function(){});
	 	//GetserverCpp_cal(index,data,function(){});
	 	index_test++;
	 	if(index_test%1000==0)
	 	console.log("over  read_cb_while_world:"+(index_test));
	 	return;
	}
	var index_while = 0;
	var read_cb_while = function(data,session){
		// console.log(JSON.stringify(session));
		// if(!ishexy)
		//  console.log(hexy.hexy(data));
		ishexy = true;
		 session.offset = 0;

		while(true){
			if (session.lengthOffset==0) {
				session.lengthOffset=1;
				//session.currentLen = 0;
				session.count = data[session.offset];
				session.buffer = "";
				session.offset++;
			}
			else if(session.lengthOffset < 4)
			{
				session.count = session.count | (data[session.offset] << (session.lengthOffset * 8));

				session.offset++; 
				session.lengthOffset++;
			}
			else
			{
	            var dataOffset = "";
	            if (data.length-session.offset>=session.count-session.buffer.length) {
	                dataOffset = data.slice(session.offset,session.offset + session.count-session.currentLen);
	                session.offset+=(session.count-session.currentLen);
	            }else {
	                dataOffset = data.slice(session.offset);
	                session.offset+=dataOffset.length;

	            }
	            session.buffer += dataOffset;
	            session.currentLen += dataOffset.length;
				//console.log("session.buffer.length:%s,session.currentLen:%s,session.count:%s",session.buffer.length,session.currentLen,session.count);
				if (session.currentLen==(session.count)) {
					session.lengthOffset =0;
					session.currentLen = 0;
					if(session.count==2&&session.buffer=="ka"){
						//console.log("-----------"+msg);
					//	console.log("session.length:2,session.buffer:%s",session.buffer);
					}else{
						//index_test++;
						index_while++;
					 	if(index_test%1000==0)
						 	console.log("over  read_cb_while:"+(index_while));
						// process.nextTick(function(){
						// 	keystone.get("innlogManager").insertLogAll(session.buffer,session);
						// });
						keystone.get("innlogManager").insertLogByQueue(session.buffer,session);
						// session = null;
						// var parms = []; d
						// for(var i =0;i<sessions.length;i++)
						// {
						// 	var parm = sessions[i];
						// 	if(parm==null)
						// 		continue;
						// 	else
						// 		parms.push(parm);
						// }
						// sessions = parms;						
						// im.insertLog(session.buffer,session,"",function(){
							
						// });
					}
				};
			}
			//session.offset++;
			if (session==null||session.offset==data.length) {
				break;
			}else if(session.offset>data.length)
				throw "sesssion.offset 溢出,session.offset length:"+session.offset.length+",session.data.length:"+data.length;
		}
		//console.log("debug it");
		//console.log("session.buffer.length:%s,session.currentLen:%s,session.count:%s,data length:%s",session.buffer.length,session.currentLen,session.count,data.length);
	}
	// if(_config.innSite.isCplusplus)
	// {
	// 	net.createServer(function(sock) {
	// 		// 我们获得一个连接 - 该连接自动关联一个socket对象
	// 		//console.log('CONNECTED: ' +
	// 		//    sock.remoteAddress + ':' + sock.remotePort);
	// 		sock.setTimeout(0);
	// 		sock.setNoDelay(true);
	// 		// 为这个socket实例添加一个"data"事件处理函数
	// 		sock.on('data', function(data) {
	// 			//console.log("onData:"+data+";DataLength:"+data.length);
	// 			//console.log("sock address:"+JSON.stringify(sock.address()));
	// 			//console.log("sock remoteAddress:"+sock.remoteAddress+";port:"+sock.remotePort);
	// 			var session = null;
	// 			if (!validate(sock.remoteAddress,sock.remotePort)) {
	// 			    session  = new tcpsession();
	// 				session.ip = sock.remoteAddress;
	// 				session.port = sock.remotePort;
	// 				sessions.push(session);
	// 			}
	// 			else{
	// 				for(var i = 0;i<sessions.length;i++){
	// 					var a = sessions[i];
	// 					if (a.ip==sock.remoteAddress&&a.port==sock.remotePort) {
	// 						session = a;
	// 						break;
	// 					};
	// 				}
	// 			}
	// 			if ((sock.remoteAddress==_config.dLog||_config.server.hostLog=="")) {
	// 				setImmediate(read_cb_while,data,session);
	// 				//read_cb_while(data,session);
	// 			}
	// 			else{
	// 				console.log("接收到非法Log数据 ip:%s",sock.remoteAddress);
	// 			}
	// 		});
	// 		sock.on('error',function(data){
	// 			winston.error(data);
	// 		});
	// 		// 为这个socket实例添加一个"close"事件处理函数
	// 		sock.on('close', function(data) {
	// 		});	
	// 	}).listen({port:_config.innSite.portCplusplus,host:_config.innSite.ipCplusplus});
	// 	console.log('Server listening on port:' + _config.innSite.portGame);		
	// }
	if(_config.innSite.isGame)
	{
		net.createServer(function(sock) {
			// 我们获得一个连接 - 该连接自动关联一个socket对象
			//console.log('CONNECTED: ' +
			//    sock.remoteAddress + ':' + sock.remotePort);
			sock.setTimeout(0);
			sock.setNoDelay(true);
			// 为这个socket实例添加一个"data"事件处理函数
			sock.on('data', function(data) {
				//console.log("onData:"+data+";DataLength:"+data.length);
				//console.log("sock address:"+JSON.stringify(sock.address()));
				//console.log("sock remoteAddress:"+sock.remoteAddress+";port:"+sock.remotePort);
				var session = null;
				if (!validate(sock.remoteAddress,sock.remotePort)) {
				    session  = new tcpsession();
					session.ip = sock.remoteAddress;
					session.port = sock.remotePort;
					sessions.push(session);
				}
				else{
					for(var i = 0;i<sessions.length;i++){
						var a = sessions[i];
						if (a.ip==sock.remoteAddress&&a.port==sock.remotePort) {
							session = a;
							break;
						};
					}
				}
				if ((sock.remoteAddress==_config.dLog||_config.server.hostLog=="")) {
					setImmediate(read_cb_while,data,session);
					//read_cb_while(data,session);
				}
				else{
					console.log("接收到非法Log数据 ip:%s",sock.remoteAddress);
				}
			});
			sock.on('error',function(data){
				winston.error(data);
			});
			// 为这个socket实例添加一个"close"事件处理函数
			sock.on('close', function(data) {
			    // console.log('CLOSED: ' +
			    //     sock.remoteAddress + ' ' + sock.remotePort);
				// var parms = [];
				// for(var i =0;i<sessions.length;i++)
				// {
				// 	var session = sessions[i];
				// 	if(session.ip == sock.remoteAddress&&session.port== sock.remotePort)
				// 		continue;
				// 	else
				// 		parms.push(session);
				// }
				// sessions = parms;

			});	
		}).listen({port:_config.innSite.portGame,host:_config.innSite.ipGame});
		console.log('Server listening on port:' + _config.innSite.portGame);
	}
	if(_config.innSite.isWorld)
	{
		net.createServer(function(sock) {
			// 我们获得一个连接 - 该连接自动关联一个socket对象
			//console.log('CONNECTED: ' +
			//    sock.remoteAddress + ':' + sock.remotePort);
			sock.setTimeout(0);
			sock.setNoDelay(true);
			// 为这个socket实例添加一个"data"事件处理函数
			sock.on('data', function(data) {
				//console.log("onData:"+data+";DataLength:"+data.length);
				//console.log("sock address:"+JSON.stringify(sock.address()));
				//console.log("sock remoteAddress:"+sock.remoteAddress+";port:"+sock.remotePort);
				var session = null;
				if (!validate(sock.remoteAddress,sock.remotePort)) {
				    session  = new tcpsession();
					session.ip = sock.remoteAddress;
					session.port = sock.remotePort;
					session.fd = sessions.length;
					sessions.push(session);
				}
				else{
					for(var i = 0;i<sessions.length;i++){
						var a = sessions[i];
						if (a.ip==sock.remoteAddress&&a.port==sock.remotePort) {
							session = a;
							break;
						};
					}
				}
				if ((sock.remoteAddress==_config.dLog||_config.server.hostLog=="")) {
					setImmediate(read_cb_while_world,data,session.fd);
					//read_cb_while(data,session);
				}
				else{
					console.log("接收到非法Log数据 ip:%s",sock.remoteAddress);
				}
			});
			sock.on('error',function(data){
				winston.error(data);
			});
			// 为这个socket实例添加一个"close"事件处理函数
			sock.on('close', function(data) {
			    // console.log('CLOSED: ' +
			    //     sock.remoteAddress + ' ' + sock.remotePort);
				// var parms = [];
				// for(var i =0;i<sessions.length;i++)
				// {
				// 	var session = sessions[i];
				// 	if(session.ip == sock.remoteAddress&&session.port== sock.remotePort)
				// 		continue;
				// 	else
				// 		parms.push(session);
				// }
				// sessions = parms;

			});	
		}).listen({port:_config.innSite.portLog});
	console.log('Server listening on port:' + _config.innSite.portLog);

	}
	if(_config.innSite.isOther)
	{
		net.createServer(function(sock) {
			// 我们获得一个连接 - 该连接自动关联一个socket对象
			//console.log('CONNECTED: ' +
			//    sock.remoteAddress + ':' + sock.remotePort);
			sock.setTimeout(0);
			sock.setNoDelay(true);
			// 为这个socket实例添加一个"data"事件处理函数
			sock.on('data', function(data) {
				//console.log("onData:"+data+";DataLength:"+data.length);
				//console.log("sock address:"+JSON.stringify(sock.address()));
				//console.log("sock remoteAddress:"+sock.remoteAddress+";port:"+sock.remotePort);
				var session = null;
				if (!validate(sock.remoteAddress,sock.remotePort)) {
				    session  = new tcpsession();
					session.ip = sock.remoteAddress;
					session.port = sock.remotePort;
					sessions.push(session);
				}
				else{
					for(var i = 0;i<sessions.length;i++){
						var a = sessions[i];
						if (a.ip==sock.remoteAddress&&a.port==sock.remotePort) {
							session = a;
							break;
						};
					}
				}
				if ((sock.remoteAddress==_config.dLog||_config.server.hostLog=="")) {
					setImmediate(read_cb_while,data,session);
					//read_cb_while(data,session);
				}
				else{
					console.log("接收到非法Log数据 ip:%s",sock.remoteAddress);
				}
			});
			sock.on('error',function(data){
				winston.error(data);
			});
			// 为这个socket实例添加一个"close"事件处理函数
			sock.on('close', function(data) {
			    // console.log('CLOSED: ' +
			    //     sock.remoteAddress + ' ' + sock.remotePort);
				// var parms = [];
				// for(var i =0;i<sessions.length;i++)
				// {
				// 	var session = sessions[i];
				// 	if(session.ip == sock.remoteAddress&&session.port== sock.remotePort)
				// 		continue;
				// 	else
				// 		parms.push(session);
				// }
				// sessions = parms;

			});	
		}).listen({port:_config.innSite.portOther,host:_config.innSite.ipOther});
		console.log('Server listening on port:' + _config.innSite.portOther);
	}
	if(_config.innSite.isCalculate)
	{
		net.createServer(function(sock) {
			// 我们获得一个连接 - 该连接自动关联一个socket对象
			//console.log('CONNECTED: ' +
			//    sock.remoteAddress + ':' + sock.remotePort);
			sock.setTimeout(0);
			sock.setNoDelay(true);
			// 为这个socket实例添加一个"data"事件处理函数
			sock.on('data', function(data) {
				//console.log("onData:"+data+";DataLength:"+data.length);
				//console.log("sock address:"+JSON.stringify(sock.address()));
				//console.log("sock remoteAddress:"+sock.remoteAddress+";port:"+sock.remotePort);
				var session = null;
				if (!validate(sock.remoteAddress,sock.remotePort)) {
				    session  = new tcpsession();
					session.ip = sock.remoteAddress;
					session.port = sock.remotePort;

					sessions.push(session);
				}
				else{
					for(var i = 0;i<sessions.length;i++){
						var a = sessions[i];
						if (a.ip==sock.remoteAddress&&a.port==sock.remotePort) {
							session = a;
							break;
						};
					}
				}
				if ((sock.remoteAddress==_config.dLog||_config.server.hostLog=="")) {
					setImmediate(read_cb_while,data,session);
					//read_cb_while(data,session);
				}
				else{
					console.log("接收到非法Log数据 ip:%s",sock.remoteAddress);
				}
			});
			sock.on('error',function(data){
				winston.error(data);
			});
			// 为这个socket实例添加一个"close"事件处理函数
			sock.on('close', function(data) {
			    // console.log('CLOSED: ' +
			    //     sock.remoteAddress + ' ' + sock.remotePort);
				// var parms = [];
				// for(var i =0;i<sessions.length;i++)
				// {
				// 	var session = sessions[i];
				// 	if(session.ip == sock.remoteAddress&&session.port== sock.remotePort)
				// 		continue;
				// 	else
				// 		parms.push(session);
				// }
				// sessions = parms;

			});	
		}).listen({port:_config.innSite.portCalculate,host:_config.innSite.ipCalculate});
		console.log('Server listening on port:' + _config.innSite.portCalculate);		
	}
	if(_config.innSite.isBase)
	{
		net.createServer(function(sock) {
			// 我们获得一个连接 - 该连接自动关联一个socket对象
			//console.log('CONNECTED: ' +
			//    sock.remoteAddress + ':' + sock.remotePort);
			sock.setTimeout(0);
			sock.setNoDelay(true);
			// 为这个socket实例添加一个"data"事件处理函数
			sock.on('data', function(data) {
				//console.log("onData:"+data+";DataLength:"+data.length);
				//console.log("sock address:"+JSON.stringify(sock.address()));
				//console.log("sock remoteAddress:"+sock.remoteAddress+";port:"+sock.remotePort);
				var session = null;
				if (!validate(sock.remoteAddress,sock.remotePort)) {
				    session  = new tcpsession();
					session.ip = sock.remoteAddress;
					session.port = sock.remotePort;

					sessions.push(session);
				}
				else{
					for(var i = 0;i<sessions.length;i++){
						var a = sessions[i];
						if (a.ip==sock.remoteAddress&&a.port==sock.remotePort) {
							session = a;
							break;
						};
					}
				}
				if ((sock.remoteAddress==_config.dLog||_config.server.hostLog=="")) {
					setImmediate(read_cb_while,data,session);
					//read_cb_while(data,session);
				}
				else{
					console.log("接收到非法Log数据 ip:%s",sock.remoteAddress);
				}
			});
			sock.on('error',function(data){
				winston.error(data);
			});
			// 为这个socket实例添加一个"close"事件处理函数
			sock.on('close', function(data) {
			    // console.log('CLOSED: ' +
			    //     sock.remoteAddress + ' ' + sock.remotePort);
				// var parms = [];
				// for(var i =0;i<sessions.length;i++)
				// {
				// 	var session = sessions[i];
				// 	if(session.ip == sock.remoteAddress&&session.port== sock.remotePort)
				// 		continue;
				// 	else
				// 		parms.push(session);
				// }
				// sessions = parms;

			});	
		}).listen({port:_config.innSite.portBase,host:_config.innSite.ipBase});
		console.log('Server listening on port:' + _config.innSite.portBase);
	}
	
	///demo lateri
	var statisticalManager = require("./manager/statistical");
	var syncManager = require("./manager/SYNCGameUserManager");
	 //实时监控相关
	var CronJob = require('cron').CronJob;
	//实时
	var baseTime = 2;
	var lastJobTime=null;
	var tCount=0;

if (mail_test){
	var sendMail1 = function(){
		keystone.list('User').model.find().where("email","liangyuanchen@163.com").exec(function(err, admins) {
			new keystone.Email('nullTemple').send({
				to: admins,
				from: {
					name: 'innSite',
					email: 'operations@innsite.com'
				},
				subject: '无尽酒馆('+_config.innSite.domainName+') Email Test! >_<',
				msg: {msg:"Demo",ip:_config.server.host,url:_config.innSite.domainName}
			}, function(error,info){
				console.log(JSON.stringify(error));
				console.log(JSON.stringify(info));
				console.log("Demo sendMail over");
			});
		});					
	}
	sendMail1();
}




