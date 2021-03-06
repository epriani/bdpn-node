define(['lib/controllers', 'db', 'models/collection', 'models/terms', 'async'], function (Controller, db, Collection, termsModel, async) {
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

	admin.post('/books/:bookId/delete', function(req, res) {
		if( !req.params.bookId ){req.send(400, 'invalid request');}
		if( !(req.user.username === 'siedrix' || req.user.username === 'epriani') ){return res.send(403, 'not enough permits');}

		var book = books.filter(function(book){return book.id === req.params.bookId;});

		if(!book.length){ return res.send(404); }
		book = book[0];

		db.view('books/revisions', {
			startkey     : [book.id],
			endkey       : [book.id, 1]
		}, function (err, docs) {
			if(err){return res.send(503);}

			var revisions = docs.map(function(key, item){
				if(key[1]){
					return {
						rev : item[2],
						id  : item[0]
					};
				}
			}).filter(function(item){return item;});

			var fns = [];

			revisions.forEach(function(revision){
				fns.push(function(done){
					console.log('deleting', revision.id, revision.rev);
					db.remove(revision.id, revision.rev, done);
				});
			});

			fns.push(function(done){
				console.log('deleting', book.id, book.value._rev);
				db.remove(book.id, book.value._rev, done);
			});

			console.log('**********************************************');
			console.log('About to delete', fns.length, 'documents');

			async.series(fns, function(err){
				if(err){return res.send(500, err);}
				console.log('**********************************************');
				console.log('Book', book.id, 'deleted');
				console.log('**********************************************');

				db.view('books/list', function (err, docs) {
					books = docs;
					termsModel.generateIndexes();
					res.redirect('/admin/books/');
				});
			});
		});
	});

	admin.get('/books/:bookId/revisions', function(req, res){
		if (!req.user) { return res.redirect('/login'); }
		if (req.user === 'waiting' || req.user === 'bloqued'){ return res.redirect('/admin');}

		var book = books.filter(function(book){return book.id === req.params.bookId;});

		if(!book.length){ return res.send(404);}
		book = book[0];

		db.view('books/revisions', {
			startkey     : [book.id],
			endkey       : [book.id, 1]
		}, function (err, docs) {
			if(err){ return res.send(503); }

			var revisions = docs.map(function(key, item){
				if(key[1]){
					return {
						humanDate : item[1] ? new Date([item[1]] * 1000) : 'N/A',
						date : item[1] || 'old',
						id   : item[0]
					};
				}
			}).filter(function(item){return item;});

			revisions.sort(function(a,b){return a.date === 'old' ? 1 : b.date - a.date;});

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
		res.show('admin/bookRevisionNew',{
			book: book,
			structure : termsModel.structureAsJson()
		});
	});

	admin.post('/books/:bookId/revisions/single/:revisionId/publish', function(req, res){
		if (!req.user) { return res.redirect('/login');}
		if (req.user === "waiting" || req.user === "bloqued"){ return res.redirect('/admin');}

		var book = books.filter(function(book){return book.id === req.params.bookId;});

		if(!book.length){return res.send(404);}

		book = book[0];

		if(req.params.revisionId !== book.value.revisionId){
			// Set revision publish values in the correr place;
			db.get(req.params.revisionId, function(err, rev){
				rev.publish = true;
				db.save(rev);
			});

			if(book.value.revisionId){			
				db.get(book.value.revisionId, function(err, rev){
					rev.publish = false;
					db.save(rev);
				});
			}
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
				termsModel.generateIndexes();
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

		var book = books.filter(function(book){return book.id === req.params.bookId;});

		if(!book.length){
			res.send(404);
			return;
		}

		book = book[0];

		db.get(req.params.revisionId, function (err, revision) {
			if(err){
				res.send(503);
				return;
			}

			if(!revision){
				res.send(404);
				return;
			}

			res.show('admin/bookRevisionSingle',{
				book: book,
				revision : revision,
				structure : termsModel.structureAsJson()
			});
		});
	});

	admin.get('/books/:bookId/images', function(req, res){
		if (!req.user) { return res.redirect('/login');}
		if (req.user === 'waiting' || req.user === 'bloqued'){ return res.redirect('/admin');}

		var book = books.filter(function(book){return book.id === req.params.bookId;});

		if(!book.length){ return res.send(404);}

		book = book[0];

		if(!book.value.revisionId){return res.show('admin/bookImages',{ book: book, revision : {} });}

		db.get(book.value.revisionId, function (err, revision) {
			if(err){ return res.send(503); }
			if(!revision){ return res.send(404); }

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