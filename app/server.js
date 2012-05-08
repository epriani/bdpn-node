define(['express','db','conf','dictionaries'], function (express, db, conf, dictionaries) {
	var app = express.createServer(),
		RedisStore = require('connect-redis')(express);

	//Static files
	app.use(express.static('./public'));

	//Session
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({
		secret : conf.redis.secret,
		store  : new RedisStore({
			host : conf.redis.host,
			port : conf.redis.port,
			user : conf.redis.user,
			pass : conf.redis.pass
		})
	}));

	//View engine
	app.set("view engine", "html");
	app.set('views', './app/views');
	app.register(".html", require("jqtpl").express);

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

				var folio        = revision.folios[0] || revision.folios[1];
				var prevFolio = null;
				var nextFolio    = 2;

				folio.lined = folio.raw.replace(/\n/g,'</br>');
				console.log(folio);
		    	res.render('books/single',{ 
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
				console.log(folio);
		    	res.render('books/single',{
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
	    res.render('terms/index',{});
	});

	//Static views
	app.get('/project'       , function(req, res){ res.render('static/project')       });
	app.get('/collaborators' , function(req, res){ res.render('static/collaborators') });
	app.get('/collaborate'   , function(req, res){ res.render('static/collaborate')   });
	app.get('/contact'       , function(req, res){ res.render('static/contact')       });
	app.get('/documentation' , function(req, res){ res.render('static/documentation') });
	app.get('/criteria'      , function(req, res){ res.render('static/criteria')      });


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
		}
	});	

	//Clear session, simple and easy
	app.get('/clear', function(req, res){
		delete req.session.lang;

		res.redirect('/');
	})

	return app;
});