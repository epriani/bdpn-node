define(['lib/controllers', 'db'], function (Controller, db) {
	console.log('Api added');
	var api = Controller({prefix : '/api'})
		,	_		= require('underscore');

	api.get('/books/', function(req,res){
		res.render('test',{ asJson : true, data : 'lol' });
	});

	api.get('/:bookId/tags', function(req, res){
	  var tags = [];
	  db.get(req.params.bookId, function (err, book) {
	    if(err) throw err;
	    db.get(book.revisionId, function (err, rev) {
	      if(err) throw err;
	      rev.folios.forEach(function(folio){
	        tags = _.union(folio.tags, tags);
	      });
	      res.send(tags);
	    });
  	});
  });

	return api;
});