define(['db'], function (db) {
	var Terms = function(){
		this.db = db;
		this.usedTerms = {};
	}

	Terms.prototype.getUsedTerms = function(clearCache) {
		var data = {},
			terms = this;

		db.view('terms/usedTags',{group:true,group_level:2}, function (err, res) {
			if(err){
				console.log('err', err);
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

	return new Terms;
});