define(['models/models'], function(models){
	var User = models.define('user', function () {
		//Properties
		this.string('username');
		this.string('role', {
			default : "waiting"
		});
		this.object('twitter');

		this.filter('byTwitterUser',{include_docs:true}, {
			map : function(doc) {
				if (doc.resource === "User") {
					emit( doc.username, null )
				}
			}
		})
	});

	return User;	
});