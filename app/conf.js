define( function () {
 	var enviroment;
	var development = {
		redis   : {
			secret : 'paas/tools',
			host   : 'bass.redistogo.com',
			port   : '9275',
			user   : 'Siedrix',
			pass   : '45ceecbaed479ac08b8e9b78d3a67756'				
		},
		couchDb : {
			user : '',
			pass : '',
			host : 'http://localhost',
			port : 5984,
			db   : 'bdpn'
		}
	}

 	var production = {
		redis   : {
			secret : 'paas/tools',
			host   : 'bass.redistogo.com',
			port   : '9275',
			user   : 'Siedrix',
			pass   : '45ceecbaed479ac08b8e9b78d3a67756'				
		}, 		
 		couchDb : {
			user : 'siedrix',
			pass : 'CgVmtJUkQRDD',
			host : 'http://siedrix.cloudant.com',
			port : 5984,
			db   : 'bdpn'
		}
 	}
 	
 	if( process.env.NODE_ENV === 'production' ){
 		enviroment = production;
 	}else{
 		enviroment = development;
 	}

	return enviroment
});