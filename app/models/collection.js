define(['models/models'], function(models){
	var Collection = models.define('collection', function () {
		//Properties
		this.string('name');
		this.array('books');

		this.filter('all',{include_docs:true}, {
			map : function(doc) {
				if (doc.resource === "Collection") {
					emit( doc.name, null )
				}
			}
		});
	});

	return Collection;	
});