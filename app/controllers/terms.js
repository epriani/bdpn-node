define(['lib/controllers', 'db', 'models/terms'], function (Controller, db, termsModel) {
	console.log('Terms controller added');
	var terms = Controller({prefix : '/terms'}),
		books = {};

	// Prefetch used terms and books
	termsModel.getUsedTerms();

	db.view('books/publishedList', function (err, docs) {
		console.log('Prefetch books');
		books = docs;
	});

	// Utilities
	var usedTermsByBook = function (data) {
		var book = {};

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

		return book;
	}

	var filterByType = function (type, data) {
		var terms = [];

		terms = data.map(function (key, value) {
			return {
				key   : key.splice(1,3),
				value : value
			};
		}).filter(function (item) {
			if(item.key[0] === type){
				return item
			}
		});

		return terms;
	}

	var filterBySubtype = function (type, subtype, data) {
		var terms = [];

		terms = data.map(function (key, value) {
			return {
				key   : key.splice(1,3),
				value : value
			};
		}).filter(function (item) {
			if(item.key[0] === type && item.key[1] === subtype){
				return item
			}
		});

		return terms;		
	}


	// Paths
	terms.get('',function(req, res){
	    res.show('terms/index',{
	    	usedTerms : termsModel.usedTerms,
	    	books     : books
	    });
	});

	terms.get('/:type', function(req, res){
		console.log('fetching ', req.params.type);

		if(req.query.book){
			db.view('terms/usedTagsByBook', {
				group_level : 4,
				startkey    : [ req.query.book ],
				endkey      : [ req.query.book  , {}],
			},function (err, doc) {
				if(err){
					console.log(err);
					res.send('err');
					return;
				}

				res.show('terms/list',{
					type      : req.params.type,
					usedTerms : usedTermsByBook(doc),
					terms     : filterByType(req.params.type, doc),
					books     : books
				});
			});
		}else{
			db.view('terms/byType',{
				startkey : [req.params.type, null],
				endkey   : [req.params.type, "ZZZZZZZZZZ"],
				group    : true
			},function(err, docs){
				if(err){
					console.log(err);
					res.send('err');
					return;
				}

				res.show('terms/list',{
					type      : req.params.type,
					usedTerms : termsModel.usedTerms,
					terms     : docs,
		    		books     : books
				});
			});
		}

	});	

	terms.get('/:type/:subtype', function(req, res){
		if(req.query.book){
			db.view('terms/usedTagsByBook', {
				group_level : 4,
				startkey    : [ req.query.book ],
				endkey      : [ req.query.book  , {}],
			},function (err, docs) {
				if(err){
					console.log(err);
					res.send('err');
					return;
				}

				res.show('terms/list',{
					type      : req.params.type,
					usedTerms : usedTermsByBook(docs),
					terms     : filterBySubtype(req.params.type, req.params.subtype, docs),
					books     : books
				});
			});
		}else{		
			db.view('terms/byType',{
				startkey : [req.params.type, req.params.subtype, null],
				endkey   : [req.params.type, req.params.subtype, "ZZZZZZZZZZ"],
				group    : true
			},
			function(err, docs){
				if(err){
					console.log(err);
					res.send('err');
					return;
				}
							
				res.show('terms/list',{
					type      : req.params.type,
					subtype   : req.params.subtype,
					usedTerms : termsModel.usedTerms,
					terms     : docs,
		    		books     : books
				});
			});
		}
	});	

	terms.get('/single/:type/:term', function(req, res){
		db.view('terms/byContent',{
			key : [req.params.type, null, req.params.term.replace(/\n/g,"\n").replace(/\t/g,"\t")]
		},
		function(err, docs){
			if(err){
				console.log(err);
				res.send('err on term by content');
				return;
			}

									
			res.show('terms/single',{
				type      : req.params.type,
				term      : req.params.term,
				terms     : docs,
				books	  : books,
				usedTerms : termsModel.usedTerms,
			});
		});
	});

	terms.get('/single/:type/:subtype/:term', function(req, res){
		db.view('terms/byContent',{
			key : [req.params.type, req.params.subtype, req.params.term]
		},
		function(err, docs){
			if(err){
				console.log(err);
				res.send('err on term by content');
				return;
			}
						
			res.show('terms/single',{
				type      : req.params.type,
				term      : req.params.term,
				terms     : docs,
				books	  : books,
				usedTerms : termsModel.usedTerms
			});
		});		
	});


	return terms;
});