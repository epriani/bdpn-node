define(['express','db'], function (express, db) {
	var app = express.createServer();

	app.use(express.static('./public'));

	app.set("view engine", "html");
	app.set('views', './app/views');
	app.register(".html", require("jqtpl").express);

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

	return app;
});