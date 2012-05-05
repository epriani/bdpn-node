define(['fs'], function (fs) {
	var path = './public/dictionaries/',
		src = ['english.json','spanish.json'],
		dictionaries = {};

	src.forEach(function(item){
		var dictionary = JSON.parse( fs.readFileSync(path + item).toString() ),
			key        = item.substring(0,2);

		dictionaries[key] = dictionary;
	});

	return dictionaries;
});