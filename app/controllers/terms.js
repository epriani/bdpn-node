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
			_(terms).each(function(count, term){
				flattenIndexes.push({
					label : term,
					count : count,
					subtype : subtype
				});
			});
		});

		return flattenIndexes;
	};

	var flatSubtype = function(indexes){
		var flattenIndexes = [];

		_(indexes).each(function(count, term){
			flattenIndexes.push({
				label : term,
				count : count
			});
		});

		return flattenIndexes;
	};

	var flatTermsWithFolios = function(data){
		var flatTermsWithFolios = [];

		_(data.reviews).each(function(review){
			_(review.doc.folios).each(function(folio){
				_(folio.tags).forEach(function(item){
					if(
						item.tag === data.type &&
						(!data.subtype || item.type === data.subtype) &&
						(item.reg === data.content || item.content === data.content)
					){
						item.bookId = review.doc.bookId;
						item.folioId = folio.hash;
						item.folioContent = folio.raw;
						item.folioTitle = folio.pb;
						flatTermsWithFolios.push(item);
					}
				});
			});
		});

		return flatTermsWithFolios;
	};

	// Paths
	terms.get('',function(req, res){
		res.show('terms/index',{
			usedTerms : termsModel.indexes,
			books     : books
		});
	});

	terms.get('/:type', function(req, res){
		console.log('fetching ', req.params.type);

		if(req.query.book){
			db.view('terms/usedTagsByBook', {
				group_level : 4,
				startkey    : [ req.query.book ],
				endkey      : [ req.query.book  , {}]
			},function (err, doc) {
				if(err){
					console.log(err);
					res.send('err');
					return;
				}

				res.show('terms/list',{
					type      : req.params.type,
					usedTerms : usedTermsByBook(doc),
					terms     : filterByType(req.params.type, doc),
					books     : books
				});
			});
		}else{
			var flattenIndexes = flatType(termsModel.indexes[req.params.type]);

			res.show('terms/list',{
				type      : req.params.type,
				usedTerms : termsModel.indexes,
				terms     : flattenIndexes,
				books     : books
			});
		}
	});

	terms.get('/:type/:subtype', function(req, res){
		if(req.query.book){
			db.view('terms/usedTagsByBook', {
				group_level : 4,
				startkey    : [ req.query.book ],
				endkey      : [ req.query.book  , {}]
			},function (err, docs) {
				if(err){
					console.log(err);
					res.send('err');
					return;
				}

				res.show('terms/list',{
					type      : req.params.type,
					usedTerms : usedTermsByBook(docs),
					terms     : filterBySubtype(req.params.type, req.params.subtype, docs),
					books     : books
				});
			});
		}else{
			var flattenIndexes = flatSubtype(termsModel.indexes[req.params.type][[req.params.subtype]]);

			res.show('terms/list',{
				type      : req.params.type,
				subtype   : req.params.subtype,
				usedTerms : termsModel.indexes,
				terms     : flattenIndexes,
				books     : books
			});
		}
	});

	terms.get('/single/:type/:term', function(req, res){
		var termsWithFolios = flatTermsWithFolios({
			reviews : termsModel.reviews,
			type : req.params.type,
			content : req.params.term
		});

		res.show('terms/single',{
			type : req.params.type,
			subtype : req.params.subtype,
			term : req.params.term,
			terms : termsWithFolios,
			books : books,
			usedTerms : termsModel.indexes
		});
	});

	terms.get('/single/:type/:subtype/:term', function(req, res){
		var termsWithFolios = flatTermsWithFolios({
			reviews : termsModel.reviews,
			type : req.params.type,
			subtype : req.params.subtype,
			content : req.params.term
		});

		res.show('terms/single',{
			type : req.params.type,
			subtype : req.params.subtype,
			term : req.params.term,
			terms : termsWithFolios,
			books : books,
			usedTerms : termsModel.indexes
		});
	});

	return terms;
});