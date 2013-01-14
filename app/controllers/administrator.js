define(['lib/controllers', 'db'], function (Controller, db) {
	console.log('Terms controller added');
	var admin = Controller({prefix : '/admin'}),
		books = {};

	console.log('ensureAuthenticated', Controller.ensureAuthenticated);

	db.view('books/publishedList', function (err, docs) {
		console.log('Prefetch books');
		books = docs;
	});

	admin.get('/', function (req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		res.show('admin/index',{
			user  : req.user,
			books : books
		});
	});

	admin.get('/books/:bookId', function(req, res){
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		if (req.user === "waiting" || req.user === "bloqued"){
			res.redirect('/admin');
			return;			
		}

		var book = books.filter(function(book){return book.id === req.params.bookId});

		if(!book.length){
			res.send(404);
			return;
		}

		book = book[0];

		res.show('admin/bookSingle',{user:req.user, book:book});
	});

	admin.get('/books/:bookId/revisions', function(req, res){
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		if (req.user === "waiting" || req.user === "bloqued"){
			res.redirect('/admin');
			return;			
		}

		var book = books.filter(function(book){return book.id === req.params.bookId});

		if(!book.length){
			res.send(404);
			return;
		}

		book = book[0];

		db.view('books/info', { 
			startkey     : [book.id],
			endkey       : [book.id, 1],
			include_docs : true
		}, function (err, docs) {
			if(err){
				res.send(503);
				return
			}

			var revisions = docs.map(function(item){
				return {
					humanDate : item.parseDate ? new Date([item.parseDate] * 1000) : 'N/A',
					date : item.parseDate || 'old',
					id   : item._id
				}
			});

			revisions.sort(function(a,b){return a.date === 'old' ? 1 : b.date - a.date})

			res.show('admin/bookRevisions',{book: book, revisions : revisions});
		});
	});

	admin.post('/books/:bookId/revisions/new', function(req, res){
		req.body.type = 'revision';
		req.body.bookId = req.params.bookId;
		req.body.parseDate = (new Date).getTime();		

		db.save(req.body, function (err, doc) {
			if(err){
				res.send(500);
			}else{
				res.send({
					id : doc._id
				});
			}
		});        
	});

	admin.get('/books/:bookId/revisions/new', function(req, res){
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		if (req.user === "waiting" || req.user === "bloqued"){
			res.redirect('/admin');
			return;			
		}

		var book = books.filter(function(book){return book.id === req.params.bookId});

		if(!book.length){
			res.send(404);
			return;
		}

		book = book[0];

		// res.send(book);
		res.show('admin/bookRevisionNew',{book: book});
	});

	admin.post('/books/:bookId/revisions/single/:revisionId/publish', function(req, res){
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		if (req.user === "waiting" || req.user === "bloqued"){
			res.redirect('/admin');
			return;			
		}

		var book = books.filter(function(book){return book.id === req.params.bookId});

		if(!book.length){
			res.send(404);
			return;
		}

		book = book[0];

		book.value.revisionId = req.params.revisionId;
		delete book.value.id;
		delete book.value.rev;

		db.save(book.value, function (err, doc) {
			if(err){
				res.send(500);
				return;
			}
			
			res.send({success : true});
			db.view('books/publishedList', function (err, docs) {
				console.log('refetch books');
				books = docs;
			});			
		});
	});

	admin.get('/books/:bookId/revisions/single/:revisionId', function(req, res){
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		if (req.user === "waiting" || req.user === "bloqued"){
			res.redirect('/admin');
			return;			
		}

		var book = books.filter(function(book){return book.id === req.params.bookId});

		if(!book.length){
			res.send(404);
			return;
		}

		book = book[0];

		db.get(req.params.revisionId, function (err, revision) {
			if(err){
				res.send(503);
				return
			}

			if(!revision){
				res.send(404);
				return
			}

			res.show('admin/bookRevisionSingle',{book: book, revision : revision});
		});		
	});

	admin.get('/books/:bookId/images', function(req, res){
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		if (req.user === "waiting" || req.user === "bloqued"){
			res.redirect('/admin');
			return;			
		}

		var book = books.filter(function(book){return book.id === req.params.bookId});

		if(!book.length){
			res.send(404);
			return;
		}

		book = book[0];

		db.get(book.value.revisionId, function (err, revision) {
			if(err){
				res.send(503);
				return
			}

			if(!revision){
				res.send(404);
				return
			}

			book.value.images = book.value.images || {};

			res.show('admin/bookImages',{book: book, revision : revision});	
		});
	});

	admin.post('/books/:bookId/images', function(req, res){
		console.log('got post')
		if (!req.user) { 
			res.send(403);
			return;
		}

		if (req.user === "waiting" || req.user === "bloqued"){
			res.send(403);
			return;			
		}		

		db.get(req.params.bookId, function(err, doc){
			if(err){
				res.send(500);
				return;
			}

			doc.images = req.body.images;

			res.send('lol')
			db.save(doc._id, doc.rev, doc, function(err,doc){
				if(err){
					res.send(500);
					return;
				}

				db.view('books/publishedList', function (err, docs) {
					console.log('Prefetch books');
					books = docs;
				});                

				res.send(200);
			});
		});

	});

	return admin;
});