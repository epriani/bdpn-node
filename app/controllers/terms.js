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
			usedTerms : termsModel.indexes,
			structure : termsModel.structure
		});
	});

	terms.get('/single/:type/:subtype/:term', function(req, res){
		var termsWithFolios = flatTermsWithFolios({
			reviews : termsModel.reviews,
			type : req.params.type,
			subtype : req.params.subtype,
			content : req.params.term,
			structure : termsModel.structure
		});

		res.show('terms/single',{
			type : req.params.type,
			subtype : req.params.subtype,
			term : req.params.term,
			terms : termsWithFolios,
			books : books,
			usedTerms : termsModel.indexes,
			structure : termsModel.structure
		});
	});

	return terms;
});