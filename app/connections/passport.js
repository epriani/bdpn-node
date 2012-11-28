define(['passport'], function (passport) {
	passport.serializeUser(function(user, done) {
	    done(null, user);
	});

	passport.deserializeUser(function(obj, done) {
	    done(null, obj);
	});

	return passport;
});