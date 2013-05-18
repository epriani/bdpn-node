define(['db'], function (db) {
	var fs = require('fs'),
		utils = require('util');

	var Terms = function(){
		this.db = db;
		this.usedTerms = {};
	};

	Terms.prototype.getUsedTerms = function(clearCache) {
		var data = {},
			terms = this;

		db.view('terms/usedTags',{group:true,group_level:2}, function (err, res) {
			if(err){
				console.log('err', err);
				return;
			}

			res.forEach(function(i,item){
				if(!data[i[0]]){
					data[ i[0] ] = {};
				}

				if(i[1]){
					data[ i[0] ][ i[1] ] = item;
				}else{
					data[ i[0] ]['plain'] = item;
				}
			});

			terms.usedTerms = data;
		});

		return this;
	};

	Terms.prototype.generateIndexes = function(fn){
		db.view('reviews/published', {include_docs: true}, function(err, reviews){
			if(err){
				console.log('err', err);
				return;
			}

			terms.reviews = reviews;
			terms.indexesByBook = {};

			var indexes = {};

			reviews.forEach(function(review){
				var tagCount = 0;

				terms.indexesByBook[review.bookId] = {};

				review.folios.forEach(function(folio){
					if(!folio.tags){
						return;
					}

					tagCount = tagCount + folio.tags.length;

					folio.tags.forEach(function(item){
						if(!indexes[item.tag]){
							indexes[item.tag] = {};
						}

						// By book
						if(!terms.indexesByBook[review.bookId][item.tag]){
							terms.indexesByBook[review.bookId][item.tag] = {};
						}

						var type = item.type || "plain";

						if(!indexes[item.tag][type]){
							indexes[item.tag][type] = {};
						}

						// By book
						if(!terms.indexesByBook[review.bookId][item.tag][type]){
							terms.indexesByBook[review.bookId][item.tag][type] = {};
						}

						if(!indexes[item.tag][type][item.reg || item.content]){
							indexes[item.tag][type][item.reg || item.content] = 0;
						}

						indexes[item.tag][type][item.reg || item.content] ++;

						// By book
						if(!terms.indexesByBook[review.bookId][item.tag][type][item.reg || item.content]){
							terms.indexesByBook[review.bookId][item.tag][type][item.reg || item.content] = 0;
						}

						terms.indexesByBook[review.bookId][item.tag][type][item.reg || item.content] ++;						

					});
				});
			});

			terms.indexes = indexes;

			if(fn){
				fn();
			}
		});
	};

	var terms = new Terms();

	return terms;
});