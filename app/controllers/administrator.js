define(['lib/controllers', 'db', 'models/collection', 'models/terms'], function (Controller, db, Collection, termsModel) {
	var admin = Controller({prefix : '/admin'}),
		books = {},
		collections = [];

	db.view('books/list', function (err, docs) {
		console.log('Prefetch books');
		books = docs;
	});

	Collection.all(function (err, docs) {
		if(docs){
			console.log('Prefetch collections');
			collections = docs
		}
	});

	admin.get('/', function (req, res) {
		res.show('admin/index',{
			user  : req.user
		})
	});

	// Books
	admin.get('/books', function(req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		res.show('admin/bookList',{
			user  : req.user,
			books : books
		});
	});

	admin.get('/books/new', function(req,res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		res.show('admin/bookNew');
	});

	admin.post('/books/new', function(req,res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		if(!req.body.author || !req.body.name){
			res.send(403);
			return;
		}

		var book = {
			name   : req.body.name,
			author : req.body.author,
			type   : "book"
		}

		db.save(book, function (err, doc) {
			if(err){
				res.send(err);
				return;
			}

			db.view('books/list', function (err, docs) {
				console.log('Refetch books');
				books = docs;
				res.redirect('/admin/books/'+ doc._id)
			});			
			
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

	admin.get('/books/:bookId/edit', function(req, res) {
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

		res.show('admin/bookEdit', book);		
	});

	admin.post('/books/:bookId/edit', function(req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		if (req.user === "waiting" || req.user === "bloqued"){
			res.redirect('/admin');
			return;			
		}

		if (!req.body.name || !req.body.author ){
			res.send(403);
			return;
		}

		var book = books.filter(function(book){return book.id === req.params.bookId});

		if(!book.length){
			res.send(404);
			return;
		}

		book = book[0];

		book.value.name   = req.body.name;
		book.value.author = req.body.author;

		db.save(book.value, function (err, doc) {
			if(err){
				res.send(500);
				return;
			}
			
			res.send({success : true});
			db.view('books/list', function (err, docs) {
				console.log('refetch books');
				books = docs;
			});			
		});		

		res.send(book);		
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

		debugger;

		var book = books.filter(function(book){return book.id === req.params.bookId;});

		if(!book.length){
			res.send(404);
			return;
		}

		book = book[0];

		if(req.params.revisionId !== book.value.revisionId){
			// Set revision publish values in the correr place;
			db.get(req.params.revisionId, function(err, rev){
				rev.publish = true;
				db.save(rev);
			});

			db.get(book.value.revisionId, function(err, rev){
				rev.publish = false;
				db.save(rev);
			});
		}

		book.value.revisionId = req.params.revisionId;
		delete book.value.id;
		delete book.value.rev;


		db.save(book.value, function (err, doc) {
			if(err){
				res.send(500);
				return;
			}

			res.send({success : true});
			db.view('books/list', function (err, docs) {
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

	//Collections
	admin.get('/collections', function (req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		console.log(collections);
		
		res.show('admin/collectionList',{
			user  : req.user,
			collections : collections
		});
	});

	admin.get('/collections/new', function (req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		res.show('admin/collectionNew');
	});

	admin.post('/collections/new', function (req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}
		
		if(!req.body.name){
			res.send(403);
			return;
		}

		var book = {
			name   : req.body.name
		}

		var collection = new Collection({
			name : req.body.name
		});

		collection.save(function (err, collection) {
			Collection.all(function (err, docs) {
				console.log('Refetch collections');
				collections = docs;
				res.redirect('/admin/collections/'+ collection.id)
			});				
		});
	});

	admin.get('/collections/:id', function (req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		var collection = collections.filter(function(c){
			return c.id === req.params.id
		});

		if(collection.length){
			res.show('admin/collectionSingle',{
				collection : collection[0],
				books      : books
			});
		}else{
			res.send(404)
		}
	});

	admin.post('/collections/:id/update-books', function (req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		Collection.get(req.params.id, function (err, doc) {
			if(err){
				res.send(500);
				return;
			}

			if(!doc){
				res.send(404);
				return;
			}

			doc.books = req.body.books;
			doc.save(function(err, doc){
				Collection.all(function (err, docs) {
					console.log('Refetch collections');
					collections = docs;
					res.send(200)
				});	
			});
		})

		res.send('lolz');
	});

	admin.get('/terms', function(req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		res.show('admin/terms',{
			user : req.user,
			tags : ['name','term','abbr','cit','q','foreign','date'],
			structure : termsModel.structure
		});
	});

	admin.post('/terms', function(req, res) {
		if (!req.user) { 
			res.redirect('/login');
			return;
		}

		termsModel.storeStructure(req.body.terms);
		
		res.send('foo');
	});

	return admin;
});