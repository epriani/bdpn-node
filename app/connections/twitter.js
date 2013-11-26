define(['passport-twitter', 'models/user', 'conf'], function (passportTwitter, User, conf) {
	TwitterStrategy = passportTwitter.Strategy;

	var TWITTER_CONSUMER_KEY = "o2Ujit8oVTqAffU6P9TsKw";
	var TWITTER_CONSUMER_SECRET = "9KKJPYQvjFwhZBqu6wgbBKZVebq5wFa8c8OiBj2Ek";

	var twitterStrategy = new TwitterStrategy({
	    consumerKey: TWITTER_CONSUMER_KEY,
	    consumerSecret: TWITTER_CONSUMER_SECRET,
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