define(['express','db','conf'], function (express, db, conf) {
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
	    res.render('index/index',{});
	});

	app.get('/books',function(req, res){
		db.view('books/publishedList', function (err, books) {
			if(err){
	    		res.render('400',{});					
	    		return;
			}

			console.log(books);
	    	res.render('books/index',{ books : books });
		});
	});

	app.get('/books/:bookId',function(req, res){
		console.log("Fetching:",req.params.bookId)
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

				var folio = revision.folios[0] || revision.folios[1];

				folio.lines = folio.raw.replace(/\n/g,'</br>');
		    	res.render('books/single',{ book : book, folio : folio });
			});
		});
	});	

	app.get('/authors',function(req, res){
		db.view('books/publishedByAuthor', function (err, books) {
			if(err){
	    		res.render('400',{});					
			}

			console.log(books);
	    	res.render('authors/index',{ books : books });
		});		

	});

	app.get('/collections',function(req, res){
	    res.render('collections/index',{});
	});

	app.get('/terms',function(req, res){
	    res.render('terms/index',{});
	});

	app.get('/project'       , function(req, res){ res.render('static/project')       });
	app.get('/collaborators' , function(req, res){ res.render('static/collaborators') });
	app.get('/collaborate'   , function(req, res){ res.render('static/collaborate')   });
	app.get('/contact'       , function(req, res){ res.render('static/contact')       });
	app.get('/documentation' , function(req, res){ res.render('static/documentation') });
	app.get('/criteria'      , function(req, res){ res.render('static/criteria')      });

	// For testing session.
	// ToDo.
	// After languaje are implemented, remove.
	app.get('/env', function(req, res){ 
		if (!req.session.items) {
			req.session.items = 1;
		}else{
			req.session.items++;
		}

		res.send( req.session );
	});

	app.get('/clear', function(req, res){
		delete req.session.items;

		res.send( req.session );
	})

	return app;
});