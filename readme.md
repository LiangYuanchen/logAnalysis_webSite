统计平台
=====================
描述
---------------------
	目前用于《无尽酒馆》数据的统计需求，可以统计实时数据，服务器状态，运行阶段数据和游戏阶段数据,游戏GMTool
环境要求
---------------------
	nodejs v0.12或以上版本
	mongodb3.0或以上版本
特性
---------------------
	系统以nodejs的keystoneJS （CMS）为基础开发，支持mongodb数据库、sqlServer数据库。web前端使用jade开发，附以easyJS和highcharts渲染前端
结构目录
	|--lib
	|  Custom libraries and other code
	|--models
	|  Your application's database models
	|--manager
	|  |统计逻辑目录
	|  |--databases
	|  |mysql数据库handler
	|  |--statscal
	|  |逻辑抽象处理类
	|  |--util
	|  |帮助类
	|--public
	|  Static files (css, js, images, etc.) that are publicly available
	|--routes
	|  |--api
	|  |  Your application's api controllers
	|  |--views
	|  |  Your application's view controllers
	|  |--index.js
	|  |  Initialises your application's routes and views
	|  |--middleware.js
	|  |  Custom middleware for your routes
	|--templates
	|  |--includes
	|  |  Common .jade includes go in here
	|  |--layouts
	|  |  Base .jade layouts go in here
	|  |--mixins
	|  |  Common .jade mixins go in here
	|  |--views
	|  |  Your application's view templates
	|--updates
	|  Data population and migration scripts
	|--package.json
	|  Project configuration for npm
	|--keystone.js
	|  Main script that starts your application

注意点
---------------------
### 需要注意的地方
	为达到良好mongodb访问效果，需要更改node_modules里的所有poolSize为10000（原始默认为1，并且是硬编码）(已解决，更新最新把版本)


### 目前的疑问
	为保证从c++服务器上获取到尽可能完整的日志，中间需要做个机制保证获取完整数据

部署注意事项
---------------------
### 使用的npm插件whois做过修改，当npm cache clean 时候需要更改whois.js的前几行为
	exports.whois = function (ip,itype, callback) {
		var prc={};
		var host=[["-h","whois.arin.net",ip],["-h","whois.ripe.net",ip],["-h","whois.apnic.net","-l",ip],["-h","whois.lacnic.net",ip]];
		prc = spawn('whois3',host[itype]);
		var whoisObj = {};
	whois下载地址：
	 wget http://ftp.apnic.net/apnic/dbase/tools/ripe-dbase-client-v3.tar.gz
	 alias whois='whois3'
### ./run 在正式服务器，里面的参数设置： 前台设置成1024，后台设置成2048


### 测试驱动开发使用
    "mocha":"1.4.0"
    需要全局安装mocha。
    	sudo npm install -g mocha
    http://mochajs.org/
    https://github.com/tj/should.js/

### 计划任务
	脚本执行，compareInnLog   每天执行一次
			 sendlog         每单位时间执行一次（默认为2分钟）

### whois命令示例 亚洲支持-l参数，其他不支持
	亚洲（apnic）：whois -h whois.apnic.net -l  76.104.15.119
	北美(arin)：whois -h whois.arin.net  76.104.15.119
	。。。
	欧洲(ripe ncc)：whois.ripe.net
	南美（lacnic）: whois.lacnic.net
### 安装memcacheq方便阶段统计的扩展

### keystone下的BSON版本过旧，需要修改如下内容：
node_modules/keystone/node_modules/mongoose/node_modules/mongodb/node_modules/bson/ext/index.js
15行改为 bson = require('../browser_build/bson');

### 更新node_modules引用库方法
(需要翻墙和支持c++11的gcc作为环境，centos须自行更新gcc版本[>=4.7],mac默认环境即可[>=10.10.4])
npm cache clean
rm -rf node_modules
npm install





