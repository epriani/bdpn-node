define(['express','db','conf','dictionaries','models/terms'], function (express, db, conf, dictionaries, terms) {
	var app        = express.createServer(),
		RedisStore = require('connect-redis')(express),
		_          = require('underscore');

	//Static files
	app.use(express.static('./public'));

	//Session
	app.use(express.bodyParser());
	app.use(express.cookieParser());

	if( process.env.NODE_ENV === 'production' ){
		app.use(express.session({
			secret : conf.redis.secret,
			store  : new RedisStore({
				host : conf.redis.host,
				port : conf.redis.port,
				user : conf.redis.user,
				pass : conf.redis.pass
			})
		}));
	}else{
		app.use(express.session({ secret: "keyboard cat" }));
	}

	//View engine
	app.set("view engine", "html");
	app.set('views', './app/views');
	app.register(".html", require("jqtpl").express);

	//Prefetch used terms
	terms.getUsedTerms();

	//Router
	app.get('/', function(req, res){
		db.view('books/publishedList', function (err, books) {
			if(err){
	    		res.render('400',{});
	    		return;
			}

	    	res.render('index/index',{ books : books });
		});		
	});

	app.get('/books',function(req, res){
		db.view('books/publishedList', function (err, books) {
			if(err){
	    		res.render('400',{});					
	    		return;
			}

	    	res.render('books/index',{ books : books });
		});
	});

	app.get('/books/:bookId',function(req, res){
		db.get(req.params.bookId, function (err, book) {
			if(err){
				res.render('404.html');
				return;
			}

			db.get(book.revisionId, function(err, revision){
				if(err){
					res.render('404.html');
					return;
				}

				var folio        = revision.folios[0];
				var prevFolio    = null;
				var nextFolio    = 2;

				folio.lined = folio.raw.replace(/\n/g,'</br>');

				var tags = _.uniq(folio.tags, null, function(item){return item.id});

				console.log('Folio 0',revision.folios[0]);
				console.log('Folio 1',revision.folios[1]);
		    	res.render('books/single',{
		    		rawTags   : JSON.stringify(tags) ,
			    	book      : book, 
			    	folio     : folio,
			    	nextFolio : nextFolio,
			    	prevFolio : prevFolio
			    });			    
			});
		});
	});	

	app.get('/books/:bookId/:folioId',function(req, res){
		db.get(req.params.bookId, function (err, book) {
			if(err){
				res.render('404.html');
				return;
			}

			db.get(book.revisionId, function(err, revision){
				if(err){
					res.render('404.html');
					return;
				}

				var currentFolio = parseInt(req.params.folioId);

				var folio        = revision.folios[currentFolio];
				var prevFolio    = 1 < currentFolio ? currentFolio - 1 : null;
				var nextFolio    = revision.folios[currentFolio + 1] ? currentFolio + 1 : null;

				folio.lined = folio.raw.replace(/\n/g,'</br>');

				var tags = _.uniq(folio.tags, null, function(item){return item.id});

		    	res.render('books/single',{
		    		rawTags   : JSON.stringify(tags) ,
			    	book      : book, 
			    	folio     : folio,
			    	nextFolio : nextFolio,
			    	prevFolio : prevFolio
			    });
			});
		});
	});

	app.get('/authors',function(req, res){
		db.view('books/publishedByAuthor', function (err, books) {
			if(err){
	    		res.render('400',{});					
			}

			//console.log(books);
	    	res.render('authors/index',{ books : books });
		});		

	});

	app.get('/collections',function(req, res){
	    res.render('collections/index',{});
	});

	app.get('/terms',function(req, res){
	    res.render('terms/index',{ usedTerms: JSON.stringify( terms.usedTerms ) });
	});

	app.get('/terms/:type', function(req, res){
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
				usedTerms : JSON.stringify( terms.usedTerms ),
				terms     : JSON.stringify( docs )
			});
		});
	});

	app.get('/cache/expire',function(req, res){
		terms.getUsedTerms();		
		res.send('Cache expire');
	});	

	app.get('/terms/:type/:subtype', function(req, res){
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
				usedTerms : JSON.stringify( terms.usedTerms ),
				terms     : JSON.stringify( docs )
			});
		});
	});

	app.get('/terms/single/:type/:term', function(req, res){
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
					usedTerms : JSON.stringify( terms.usedTerms ),				
				});
			});
		});
	});

	app.get('/terms/single/:type/:subtype/:term', function(req, res){
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
					usedTerms : JSON.stringify( terms.usedTerms ),				
				});
			});
		});		
	});

	//Static views
	app.get('/project', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/project-en');
		}else{
			res.render('static/project');
		}		
	});

	app.get('/collaborators', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/collaborators-en');
		}else{
			res.render('static/collaborators');
		}		
	});
	
	app.get('/collaborate', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/collaborate-en');
		}else{
			res.render('static/collaborate');
		}		
	});

	app.get('/contact', function(req, res){
		console.log('get /contact', req.query.success);
		if (req.session.lang == "en") {
			res.render('static/contact-en', {success : req.query.success});
		}else{
			res.render('static/contact',{success : req.query.success});
		}		
	});	

	app.post('/contact', function(req, res){
		console.log('post /contact');
		var contact = _.extend({}, req.body);
		contact.type = 'contact';
		//req.body.type = 'contact';

		console.log('sending to db', contact);
		db.save(contact, function (err, doc) {
			res.redirect('/contact?success=true');
		});
	});

	app.get('/documentation', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/documentation-en');
		}else{
			res.render('static/documentation');
		}		
	});

	app.get('/criteria', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/criteria-en');
		}else{
			res.render('static/criteria');
		}		
	});


	//Dictionary change
	app.get('/lang',function(req, res){ 
		if (req.session.lang == "en") {
			req.session.lang = "sp";
		}else{
			req.session.lang = "en";
		}

		res.redirect(req.query.path);
	});

	app.dynamicHelpers({
		dictionary: function(req, res){
			return dictionaries[req.session.lang || "sp"];
		},
		currentDictionary : function(req, res){
			return req.session.lang || "sp";
		},
		env : function(req,res){
			return process.env.NODE_ENV;
		}
	});	

	//Clear session, simple and easy
	app.get('/clear', function(req, res){
		delete req.session.lang;

		res.redirect('/');
	})

	return app;
});