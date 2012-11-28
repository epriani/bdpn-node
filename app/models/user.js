define(['models/models'], function(models){
	var User = models.define('user', function () {
		//Properties
		this.string('username');
		this.string('role', {
			default : "waiting"
		});
		this.object('twitter');
	});

	return User;	
});