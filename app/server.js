define(['express','db','conf','dictionaries','models/terms', 'connections/passport', 'connections/twitter'], 
	function (express, db, conf, dictionaries, terms, passport, twitterStrategy) {
	var app        = express.createServer(),
		RedisStore = require('connect-redis')(express),
		_          = require('underscore');

	//Add services to passports
	passport.use(twitterStrategy);

	//Static files
	app.use(express.static('./public'));

	//Session
	app.use(express.bodyParser());
	app.use(express.cookieParser());

	if( process.env.NODE_ENV === 'production' ){
		// app.use(express.session({
		// 	secret : conf.redis.secret,
		// 	store  : new RedisStore({
		// 		host : conf.redis.host,
		// 		port : conf.redis.port,
		// 		user : conf.redis.user,
		// 		pass : conf.redis.pass
		// 	})
		// }));
		app.use(express.session({ secret: "keyboard cat" }));
	}else{
		app.use(express.session({
			secret : "keyboard cat",
			store  : new RedisStore({})
		}));		
		//app.use(express.session({ secret: "keyboard cat" }));
	}

	//Add passport to express
	app.configure(function() {
	    app.use(express.logger());
	    app.use(express.methodOverride());
	    app.use(passport.initialize());
	    app.use(passport.session());
	});


	//View engine
	app.set("view engine", "html");
	app.set('views', './app/views');
	app.register(".html", require("jqtpl").express);

	//Add Controllers
	var api   = require('controllers/api')(app);
	var books = require('controllers/books')(app);
	var terms = require('controllers/terms')(app);
	var admin = require('controllers/administrator')(app);


	//Router
	app.get('/', function(req, res){
		db.view('books/publishedList', function (err, books) {
			if(err){
	    		res.render('400',{});
	    		return;
			}

	    	res.render('index/index',{ books : books });
		});		
	});	

	app.get('/authors',function(req, res){
		db.view('books/publishedByAuthor', function (err, books) {
			if(err){
	    		res.render('400',{});					
			}

			//console.log(books);
	    	res.render('authors/index',{ books : books });
		});		

	});

	app.get('/collections',function(req, res){
	    res.render('collections/index',{});
	});

	app.get('/cache/expire',function(req, res){
		terms.getUsedTerms();		
		res.send('Cache expire');
	});	

	//Static views
	app.get('/project', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/project-en');
		}else{
			res.render('static/project');
		}		
	});

	app.get('/collaborators', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/collaborators-en');
		}else{
			res.render('static/collaborators');
		}		
	});
	
	app.get('/collaborate', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/collaborate-en');
		}else{
			res.render('static/collaborate');
		}		
	});

	app.get('/contact', function(req, res){
		console.log('get /contact', req.query.success);
		if (req.session.lang == "en") {
			res.render('static/contact-en', {success : req.query.success});
		}else{
			res.render('static/contact',{success : req.query.success});
		}		
	});	

	app.post('/contact', function(req, res){
		console.log('post /contact');
		var contact = _.extend({}, req.body);
		contact.type = 'contact';
		//req.body.type = 'contact';

		console.log('sending to db', contact);
		db.save(contact, function (err, doc) {
			res.redirect('/contact?success=true');
		});
	});

	app.get('/documentation', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/documentation-en');
		}else{
			res.render('static/documentation');
		}		
	});

	app.get('/criteria', function(req, res){
		if (req.session.lang == "en") {
			res.render('static/criteria-en');
		}else{
			res.render('static/criteria');
		}		
	});


	//User login with twitter
	app.get('/login', function (req, res) {
		res.render('login/index', {user : req.user});
	});

	app.use('/auth/twitter',passport.authenticate('twitter'),
	function(req, res){
	    // The request will be redirected to Twitter for authentication, so this
	    // function will not be called.
	});

	app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login?admin' }),
	function(req, res) {
	      res.redirect('/admin/');
	});	

	//Dictionary change
	app.get('/lang',function(req, res){ 
		if (req.session.lang == "en") {
			req.session.lang = "sp";
		}else{
			req.session.lang = "en";
		}

		res.redirect(req.query.path);
	});

	app.dynamicHelpers({
		dictionary: function(req, res){
			return dictionaries[req.session.lang || "sp"];
		},
		currentDictionary : function(req, res){
			return req.session.lang || "sp";
		},
		env : function(req,res){
			return process.env.NODE_ENV;
		}
	});	

	//Clear session, simple and easy
	app.get('/clear', function(req, res){
		delete req.session.lang;

		res.redirect('/');
	})

	return app;
});