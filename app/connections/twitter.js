define(['passport-twitter', 'models/user', 'conf'], function (passportTwitter, User, conf) {
	var TwitterStrategy = passportTwitter.Strategy;

	var twitterStrategy = new TwitterStrategy({
		consumerKey: conf.twitter.twitterConsumerKey,
		consumerSecret: conf.twitter.twitterConsumerSecret,
		callbackURL: conf.twitter.callbackUrl
	},function(token, tokenSecret, profile, done) {

		User.byTwitterUser(profile.username.toLowerCase() , function (err, docs){
			if(err){
				done(err, docs);
				return;
			}

			if(docs.length){
				done(null, docs[0]);
			}else{
				var user = new User({
					username    : profile.username.toLowerCase(),
					twitter : {
						profile     : profile,
						token       : token,
						tokenSecret : tokenSecret
					}
				});

				user.save(function(err, savedUser){
					done(null, savedUser);
				});
			}
		});
	});

	return twitterStrategy;
});