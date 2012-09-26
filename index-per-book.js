var request = require('request'),
	JSONStream = require('JSONStream'),
	es = require('event-stream'),
	fs = require('fs'),
	util = require('util');

var book = {};

var url = 'http://localhost:5984/bdpn/_design/terms/_view/usedTagsByBook?group_level=4&startkey=[%224c458cf485bfa3e4e0361be823000ee5%22]&endkey=[%224c458cf485bfa3e4e0361be823000ee5%22,{}]',
	parser = JSONStream.parse(['rows', true]);

var formater = es.mapSync(function (data) {
  	var tagName = data.key[1],
  		subType = data.key[2] || 'plain',
  		content = data.key[3];

	if(!book[tagName]){
		book[tagName] = {};
	}

	if(!book[tagName][subType]){
		book[tagName][subType] = {};
	}	

	book[tagName][subType][content] = data.value;

  	return data
});

var toFile = es.wait (function(){

	console.log('ended', book);

	fs.writeFile('./data.json', util.inspect(book, false, 4) );
});

var req = request({
	url: url
}, function (_,res,body) {
	var data = JSON.parse(body);

	data.rows.forEach(function (row) {
	  	var tagName = row.key[1],
	  		subType = row.key[2] || 'plain',
	  		content = row.key[3];

		if(!book[tagName]){
			book[tagName] = {};
		}

		if(!book[tagName][subType]){
			book[tagName][subType] = {};
		}	

		book[tagName][subType][content] = row.value;
	});

	fs.writeFile('./data.json', util.inspect(book, false, 4) );
});

//req.pipe(parser).pipe(formater).pipe(toFile);
