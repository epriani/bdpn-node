define(['lib/controllers','db'], function (Controller,db) {
	var books = Controller({prefix : '/books'}),
		_     = require('underscore');

	books.get('',function(req, res){
		db.view('books/publishedList', function (err, books) {
			if(err){
	    		res.render('400',{});					
	    		return;
			}

	    	res.show('books/index',{ books : books });
		});
	});

	books.get('/:bookId',function(req, res){
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
				var nextFolio    = 1;

				folio.lined = folio.raw.replace(/\n/g,'</br>');
				folio.tags  = folio.tags || {};

				var tags = _.uniq(folio.tags, null, function(item){return item.id});

				// console.log('Folio 0',revision.folios[0]);
				// console.log('Folio 1',revision.folios[1]);
		    	res.show('books/single',{
		    		rawTags   : tags,
			    	book      : book, 
			    	folio     : folio,
			    	nextFolio : nextFolio,
			    	prevFolio : prevFolio
			    });			    
			});
		});
	});	

	books.get('/:bookId/:folioId',function(req, res){
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
				var prevFolio    = 0 !== currentFolio ? currentFolio - 1 : null;
				var nextFolio    = revision.folios[currentFolio + 1] ? currentFolio + 1 : null;

				folio.lined = folio.raw.replace(/\n/g,'</br>');
				folio.tags  = folio.tags || {};

				var tags = _.uniq(folio.tags, null, function(item){return item.id});

		    	res.show('books/single',{
		    		rawTags   : tags,
			    	book      : book, 
			    	folio     : folio,
			    	nextFolio : nextFolio,
			    	prevFolio : prevFolio
			    });
			});
		});
	});

	return books;
});