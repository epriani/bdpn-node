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