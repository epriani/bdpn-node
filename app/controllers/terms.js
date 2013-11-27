define(['lib/controllers', 'db', 'models/terms'], function (Controller, db, termsModel) {
	var terms = Controller({prefix : '/terms'}),
		books = {},
		_     = require('underscore');

	// Prefetch used terms and books
	// termsModel.getUsedTerms();
	termsModel.generateIndexes();

	db.view('books/publishedList', function (err, docs) {
		console.log('Prefetch books');
		books = docs;
	});

	// Utilities
	var usedTermsByBook = function (data) {
		var book = {};

		data.rows.forEach(function (row) {
			var tagName = row.key[1],
				subType = row.key[2] || 'plain',
				content = row.key[3];

			if(!book[tagName]){
				book[tagName] = {};
			}

			if(!book[tagName][subType]){
				book[tagName][subType] = {};
			}

			book[tagName][subType][content] = row.value;
		});

		return book;
	};

	var filterByType = function (type, data) {
		var terms = [];

		terms = data.map(function (key, value) {
			return {
				key   : key.splice(1,3),
				value : value
			};
		}).filter(function (item) {
			if(item.key[0] === type){
				return item;
			}
		});

		return terms;
	};

	var filterBySubtype = function (type, subtype, data) {
		var terms = [];

		terms = data.map(function (key, value) {
			return {
				key   : key.splice(1,3),
				value : value
			};
		}).filter(function (item) {
			if(item.key[0] === type && item.key[1] === subtype){
				return item;
			}
		});

		return terms;
	};

	var flatType = function(indexes){
		var flattenIndexes = [];

		_(indexes).each(function(terms, subtype){
			_(terms).each(function(item, term){
				flattenIndexes.push({
					label : term,
					count : item.count,
					id : item.id,
					subtype : subtype
				});
			});
		});

		return flattenIndexes;
	};

	var flatSubtype = function(indexes){
		var flattenIndexes = [];

		_(indexes).each(function(item, term){
			flattenIndexes.push({
				label : term,
				count : item.count,
				id    : item.id
			});
		});

		return flattenIndexes;
	};

	var flatTermsWithFolios = function(data){
		var flatTermsWithFolios = [];

		console.log('flatTermsWithFolios', data);

		_(data.indexes).each(function(terms, subtype){
			console.log('***********************');
			console.log(subtype);
		});

		/*
		_(data.indexes).each(function(index){
			_(review.doc.folios).each(function(folio){
				_(folio.tags).forEach(function(item){
					console.log(item.id, data.id);
					if(
						// item.tag === data.type &&
						// (!data.subtype || item.type === data.subtype) &&
						item.id === data.id
					){
						console.log('found', data.id);
						item.bookId = review.doc.bookId;
						item.folioId = folio.hash;
						item.folioContent = folio.raw;
						item.folioTitle = folio.pb;
						flatTermsWithFolios.push(item);
					}
				});
			});
		});
		*/

		return flatTermsWithFolios;
	};

	// Paths
	terms.get('',function(req, res){
		res.show('terms/index',{
			usedTerms : termsModel.indexes,
			books     : books,
			structure : termsModel.structure
		});
	});

	terms.get('/:type', function(req, res){
		var flattenIndexes;

		if(req.query.book){
			flattenIndexes = flatType(termsModel.indexesByBook[req.query.book][req.params.type]);

			res.show('terms/list',{
				type      : req.params.type,
				usedTerms : termsModel.indexes,
				terms     : flattenIndexes,
				books     : books,
				structure : termsModel.structure
			});
		}else{
			flattenIndexes = flatType(termsModel.indexes[req.params.type]);

			res.show('terms/list',{
				type      : req.params.type,
				usedTerms : termsModel.indexes,
				terms     : flattenIndexes,
				books     : books,
				structure : termsModel.structure
			});
		}
	});

	terms.get('/:type/:subtype', function(req, res){
		var flattenIndexes;

		if(req.query.book){
			flattenIndexes = flatSubtype(termsModel.indexesByBook[req.query.book][req.params.type][[req.params.subtype]]);

			res.show('terms/list',{
				type      : req.params.type,
				subtype   : req.params.subtype,
				usedTerms : termsModel.indexes,
				terms     : flattenIndexes,
				books     : books,
				structure : termsModel.structure
			});
		}else{
			flattenIndexes = flatSubtype(termsModel.indexes[req.params.type][[req.params.subtype]]);

			res.show('terms/list',{
				type      : req.params.type,
				subtype   : req.params.subtype,
				usedTerms : termsModel.indexes,
				terms     : flattenIndexes,
				books     : books,
				structure : termsModel.structure
			});
		}
	});

	terms.get('/single/:type/:termId', function(req, res){
		console.log('Fetching single term with type', req.params.termId);

		var termsWithFolios = [];

		_.each(termsModel.reviews, function(review){
			_.each(review.doc.folios, function(folio){
				_.each(folio.tags, function(item){
					if(
						req.params.termId  === item.id &&
						req.params.type    === item.tag
					){
						item.bookId       = review.doc.bookId;
						item.revisionId   = review.doc._id;
						item.folioId      = folio.hash;
						item.folioContent = folio.raw;
						item.folioTitle   = folio.pb;

						termsWithFolios.push(item);
						console.log('Found:',item, review);
					}
				});
			});
		});

		res.show('terms/single',{
			type : req.params.type,
			subtype : req.params.subtype,
			termId : req.params.termId,
			terms : termsWithFolios,
			books : books,
			usedTerms : termsModel.indexes,
			structure : termsModel.structure
		});
	});

	terms.get('/single/:type/:subtype/:termId', function(req, res){
		console.log('Fetching single term with subtype', req.params.type, req.params.subtype ,req.params.termId);

		var termsWithFolios = [];

		_.each(termsModel.reviews, function(review){
			_.each(review.doc.folios, function(folio){
				_.each(folio.tags, function(item){
					if(
						req.params.termId  === item.id &&
						req.params.type    === item.tag &&
						req.params.subtype === item.type
					){
						item.bookId       = review.doc.bookId;
						item.revisionId   = review.doc._id;
						item.folioId      = folio.hash;
						item.folioContent = folio.raw;
						item.folioTitle   = folio.pb;

						termsWithFolios.push(item);
					}
				});
			});
		});

		res.show('terms/single',{
			type : req.params.type,
			subtype : req.params.subtype,
			termId : req.params.termId,
			terms : termsWithFolios,
			books : books,
			usedTerms : termsModel.indexes,
			structure : termsModel.structure
		});
	});

	return terms;
});