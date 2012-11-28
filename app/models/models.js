define(['conf', 'resourceful'], function (conf, resourceful) {
	resourceful.use('couchdb', {
		database : conf.couchDb.db,
		host : conf.couchDb.host,
		port : conf.couchDb.port,
		auth: { username: conf.couchDb.user, password: conf.couchDb.pass }
	});

	return resourceful;
});