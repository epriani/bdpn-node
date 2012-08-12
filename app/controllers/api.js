define(['lib/controllers'], function (Controller) {
	console.log('Api added');
	var api = Controller({prefix : '/api'});

	api.get('/books/', function(req,res){
		res.render('test',{ asJson : true, data : 'lol' });
	});

	return api;
});