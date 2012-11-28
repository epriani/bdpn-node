define(['passport-twitter', 'models/user'], function (passportTwitter, User) {
	TwitterStrategy = passportTwitter.Strategy;

	var TWITTER_CONSUMER_KEY = "ipO3vaFSrRGJA1MSmU8A";
	var TWITTER_CONSUMER_SECRET = "oKeqJDg3O9YMK4MUQq88Smouh7NgPZKTwMLM1PmMMM";

	var twitterStrategy = new TwitterStrategy({
	    consumerKey: TWITTER_CONSUMER_KEY,
	    consumerSecret: TWITTER_CONSUMER_SECRET,
	    callbackURL: "http://127.0.0.1:8080/auth/twitter/callback"
	},function(token, tokenSecret, profile, done) {
	    User.find({username:profile.username.toLowerCase()}, function(err, docs){
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