define(['cradle','conf'], function (cradle,conf) {
	var connection = new(cradle.Connection)(conf.couchDb.host, conf.couchDb.port, {
		auth: { username: conf.couchDb.user, password: conf.couchDb.pass }
	});
	var db = connection.database(conf.couchDb.db);	

	return db;
});