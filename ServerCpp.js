var net = require('net');
var hexy =require("hexy");
var p = require('protobufjs');
//var  client = null;
var ServerCpp = function(port,host,res,isList,cb){
        this.dataAll = null;
        this.bufferLength = 0;
        this.hasFirst = false;
        this.getLength = false;
        this.bufferLength  = 0;
        var self = this;
        if (isList&&port&&host) {
              self.connect(port,host,function(){
                //console.log('getRecode');
                //console.log(sc.getDataAll());
                if(cb&& (typeof cb == "function"))
                {
                    cb(self);
                }
                var result={};
                if (self.getDataAll()&&self.getDataAll().length>0) {
                    var data = eval("("+self.getDataAll()+")");
                    if (!!data==false) {
                        data = [];
                    };
                    result.total=data.length;
                    result.rows = data;
                    res.send(result);
                }else{
                    var result={total:0,rows:[]};
                    res.send(result);
                }
                self.close();
            });
        }else if(port&&host&&res){
            self.connect(port,host,function(){
                if(self.getDataAll()){
                    res.set('Content-Type', 'application/octet-stream');
                    res.send(self.getBuffer());
                    //demo
                    // var fs = require("fs");
                    // var writer =  fs.createWriteStream("./user.data",{
                    //   flags:"w",
                    //   defaultEncoding: 'binary',
                    //   fd: null,
                    //   mode:0o666
                    // });
                    // writer.write(self.getBuffer());
                    // writer.end();
                }
                else
                    res.send("");
                self.close();
            });
        }
        else if(port&&host){
             self.connect(port,host,function(){
                self.close();
            });

        }

};
module.exports = ServerCpp;
ServerCpp.prototype.dataAll = null;
ServerCpp.prototype.buffer = null;
ServerCpp.prototype.bufferLength = 0;
ServerCpp.prototype.hasFirst = false;
ServerCpp.prototype.getLength = false;
ServerCpp.prototype.client = null;
ServerCpp.prototype.getDataAll = function(){
    return this.dataAll;
}
ServerCpp.prototype.getBuffer = function(){
    return this.buffer;
}

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
//var lastRigthMsg = null;

ServerCpp.prototype.read_cb_while = function(data,session,cb){
    // console.log(JSON.stringify(session));
    //console.log(hexy.hexy(data));

     session.offset = 0;
     var self = this;
     var parm = [];
     //session.currentLen = 0;
     var a = true;

    while(true){
        if (session.lengthOffset==0) {
            session.lengthOffset=1;
            //session.currentLen = 0;
            session.count =0;
            parm.push(data[session.offset]);
            session.buffer = [];
            session.bufferArr = [];
            session.offset++;
        }
        else if(session.lengthOffset < 5)
        {
           session.lengthOffset++;
            parm.push(data[session.offset]);
            if (session.lengthOffset==5) {

                var length = new Buffer(parm);
                length = length.toString();
              // console.log("lalala length:"+length);
                session.count = parseInt(length,16);
            };
            session.offset++;
            //session.count = session.count | (data[session.offset] << (session.lengthOffset * 8));
        }
        else
        {
            var dataOffset = null;
            if (data.length-session.offset>=session.count-session.buffer.length) {
                dataOffset = data.slice(session.offset,session.offset + session.count-session.buffer.length);
                session.offset+=(session.count-session.buffer.length);
            }else {
                dataOffset = data.slice(session.offset);
                session.offset=data.length;
            }
            session.bufferArr.push(dataOffset);
            session.buffer = Buffer.concat(session.bufferArr);
            session.currentLen += dataOffset.length;
           // console.log(typeof session.buffer);
            if (session.currentLen==(session.count)) {
                session.lengthOffset =0;
                var msg = session.buffer.toString();

                //console.log("------");
                //这里断点下msg内容，看看是否有问题
                self.buffer = session.buffer;
                //this.insertLog(session.buffer,session);
                self.dataAll = msg;
               // console.log("data:"+self.dataAll);
                cb();//bug
                break;//这里不应该break，但是因为是单一连接，所以cb处理过后这里也没关系
            };
           // console.log("a:%s \n,data.length:%s, \nsession.offset:%s, \n session.buffer.lengthB:%s,\n session.buffer.toString().length:%s ,\nsession.count:%s,",a,data.length,session.offset,session.buffer.lengthB(),session.buffer.toString().length,session.count);
        }
       // session.offset++;
        if (session.offset==data.length) {
            if (session.count==0) {
                self.dataAll="";
                //self.buffer = new Buffer(msg);
                cb();
            };
            //self.dataAll = "";
            //console.log("has something error at read_cb_while")
            //console.log("session.count:%s,offset:%s,session.bufferLength:%s,data.length:%s",session.count,session.offset,session.buffer.length,data.length);
            //cb();
            break;
        };
    }
}

var sessions = [];
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
ServerCpp.prototype.session = null;
ServerCpp.prototype.connect = function(port,host,cb){
        //var lport = GetPort();
        this.client = new net.Socket(
        );
    this.socketClose = false;
    // 为客户端添加“data”事件处理函数
    // data是服务器发回的数据
    var self = this;
    self.session  = new tcpsession();
    self.session.ip = host;
    self.session.port = port;
    this.client.on('data', function(data) {
        var str = data.toString("utf8");
        //console.log("end:"+str.lastIndexOf('}')+",data length:"+str.length);
        if (!self.hasFirst) {
            self.hasFirst = true;
            if (str.length>25){
                console.log("----------------------")
                console.log("error:"+str);
            }
            return;
        }else{
           // sessions.push(session);
            self.read_cb_while(data,self.session,cb);
        }
    });
    // 为客户端添加“close”事件处理函数
    this.client.on('close', function() {
        console.log('Connection closed');
    });
    this.client.on('error',function(data){
        console.log(data);
        this.dataAll = "error";
        cb();
    });
    this.client.on('drain',function(data){
            console.log("drain:"+data);
    });
    this.client.on('timeout',function(data){
            console.log("timeout:"+data);
            this.client.destroy();
    });
    this.client.on('end',function(data){
        console.log('end:'+data);
    });
        //console.log(localAddress+":"+lport)
        var self = this;
        this.client.connect({
            host:host,
            port:port
        }, function() {
        //console.log(net._createServerHandle);
        //console.log('CONNECTED TO: ' + host + ':' + port);
       // console.log('local address:'+ JSON.stringify(self.client.address()));

        //console.log('local port:' + client.localPort);
        // this.client.setTimeout(5000,function(){
        //     console.log("超时关闭连接");
        //     this.client.destroy();
        // });
        // 建立连接后立即向服务器发送数据，服务器将收到这些数据
    });

};
ServerCpp.prototype.localLog = function(){
    if (this.client) {
        console.log("address:"+JSON.stringify( this.client.address()));
        }
    }
ServerCpp.prototype.pipeBuffer = function(buffer){
    this.client.write(buffer);
}
ServerCpp.prototype.write = function(data){
    this.client.write(data+'\n');
};
ServerCpp.prototype.writeWithCallBack = function(data,callback){
    //syslog.writeLog("send:"+data.substring(0,100));
    this.client.write(data+'\n','utf8',callback);
};
ServerCpp.prototype.close = function(){
    this.socketClose = true;
    this.client.destroy();
};
ServerCpp.prototype.decodeProtoData = function(type){
    var self = this;
    var builder = p.loadProtoFile("dbinterface.proto"),
    gs          = builder.build(type);
    var decodeMsg = gs.decode(self.buffer);
    return decodeMsg;
}
ServerCpp.prototype.encodeProtoData = function(data,type){
    var self = this;
    var builder = p.loadProtoFile("dbinterface.proto"),
    gs          = builder.build(type);
    var obj     = new gs(data);
    var encodeMsg = obj.encode().buffer;
    return encodeMsg;
}
