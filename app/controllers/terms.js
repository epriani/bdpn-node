define(['lib/controllers', 'db', 'models/terms'], function (Controller, db, termsModel) {
	console.log('Terms controller added');
	var terms = Controller({prefix : '/terms'});

	//Prefetch used terms
	termsModel.getUsedTerms();

	terms.get('',function(req, res){
	    res.render('terms/index',{ usedTerms: JSON.stringify( termsModel.usedTerms ) });
	});

	terms.get('/:type', function(req, res){
		console.log('fetching ', req.params.type);

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

			res.render('terms/list',{
				type      : req.params.type,
				usedTerms : JSON.stringify( termsModel.usedTerms ),
				terms     : JSON.stringify( docs )
			});
		});
	});

	terms.get('/:type/:subtype', function(req, res){
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
						
			res.render('terms/list',{
				type      : req.params.type,				
				subtype   : req.params.subtype,				
				usedTerms : JSON.stringify( termsModel.usedTerms ),
				terms     : JSON.stringify( docs )
			});
		});
	});

	terms.get('/single/:type/:term', function(req, res){
		db.view('terms/byContent',{
			key : [req.params.type, null, req.params.term]
		},
		function(err, docs){
			if(err){
				console.log(err);
				res.send('err on term by content');
				return;
			}
			
			db.view('books/list',function(err,books){
				if(err){
					console.log(err);
					res.send('err on term by content');
					return;
				}
							
				res.render('terms/single',{
					type      : req.params.type,
					term      : req.params.term,
					terms     : JSON.stringify( docs ),
					books	  : JSON.stringify( books ),
					usedTerms : JSON.stringify( termsModel.usedTerms ),				
				});
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
			
			db.view('books/list',function(err,books){
				if(err){
					console.log(err);
					res.send('err on term by content');
					return;
				}
							
				res.render('terms/single',{
					type      : req.params.type,
					term      : req.params.term,
					terms     : JSON.stringify( docs ),
					books	  : JSON.stringify( books ),
					usedTerms : JSON.stringify( termsModel.usedTerms ),				
				});
			});
		});		
	});


	return terms;
});