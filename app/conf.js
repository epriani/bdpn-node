var fs = require('fs');
var readConf = function (filePath) {
	var conf = fs.readFileSync(filePath).toString();
	return JSON.parse(conf);
};

define( function () {
	var enviroment;

	// var production = {
	// 	redis   : {
	// 		secret : 'paas/tools',
	// 		host   : 'bass.redistogo.com',
	// 		port   : '9275',
	// 		user   : 'Siedrix',
	// 		pass   : '45ceecbaed479ac08b8e9b78d3a67756'
	// 	},
	// 	couchDb : {
	// 		user : 'siedrix',
	// 		pass : 'CgVmtJUkQRDD',
	// 		host : 'http://siedrix.cloudant.com',
	// 		port : 5984,
	// 		db   : 'bdpn'
	// 	},
	// 	twitter : {
	// 		callbackUrl : 'http://www.bdpn.unam.mx/auth/twitter/callback'
	// 	}
	// };

	if( process.env.NODE_ENV === 'production' ){
		enviroment = readConf('./config/prod.json');
		enviroment.env = 'production';
	}else{
		enviroment = readConf('./config/dev.json');
		enviroment.env = 'development';
	}

	console.log('Loading env:', enviroment.env );

	return enviroment;
});