define(['express','db','conf','dictionaries','models/terms', 'models/collection','connections/passport', 'connections/twitter'], 
	function (express, db, conf, dictionaries, terms, Collections, passport, twitterStrategy) {
	var app        = express.createServer(),
		RedisStore = require('connect-redis')(express),
		_          = require('underscore'),
		url        = require('url');

	//Add services to passports
	passport.use(twitterStrategy);

	//Static files
	app.use(express.static('./public'));

	//Session
	app.use(express.bodyParser());
	app.use(express.cookieParser());

	if( process.env.NODE_ENV === 'production' ){
		app.use(express.session({ secret: 'K7D2AoR6Oqr5NeLJMcC0' }));
	}else{
		app.use(express.session({
			secret : 'K7D2AoR6Oqr5NeLJMcC0',
			store  : new RedisStore({})
		}));
	}

	//Add passport to express
	app.configure(function() {
		app.use(express.logger());
		app.use(express.methodOverride());
		app.use(passport.initialize());
		app.use(passport.session());
	});


	//View engine
	app.set('view engine', 'html');
	app.set('views', './app/views');
	app.register('.html', require('jqtpl').express);

	//Add Controllers
	require('controllers/api')(app);
	require('controllers/books')(app);
	require('controllers/terms')(app);
	require('controllers/administrator')(app);

	//Router
	//Ensure host is http://www.bdpn.unam.mx/ on production
	if( process.env.NODE_ENV === 'production' && false){
		console.log('Ensure host is http://www.bdpn.unam.mx/ on production');
		app.get('*', function(req, res, next){
			console.log('host:', req.headers.host !== 'www.bdpn.unam.mx', req.headers.host, req.url);
			if(req.headers.host !== 'www.bdpn.unam.mx'){
				console.log('redirecting', 'http://www.bdpn.unam.mx' + req.url, 301);
				res.redirect('http://www.bdpn.unam.mx' + req.url, 301);
			}else{
				next();
			}
		});
	}

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
		Collections.all(function(err, collections){
			if(err){
				res.send(500);
				return;
			}

			db.view('books/list', function (err, books) {
				res.render('collections/index', {
					collections : collections,
					allBooks : books,
					viewData : JSON.stringify({
						collections : collections,
						books : books
					})
				});
			});
		});
	});

	app.get('/cache/expire',function(req, res){
		terms.getUsedTerms();
		res.send('Cache expire');
	});

	//Static views
	app.get('/project', function(req, res){
		if (req.session.lang === 'en') {
			res.render('static/project-en');
		}else{
			res.render('static/project');
		}
	});

	app.get('/collaborators', function(req, res){
		if (req.session.lang === 'en') {
			res.render('static/collaborators-en');
		}else{
			res.render('static/collaborators');
		}
	});
	
	app.get('/collaborate', function(req, res){
		if (req.session.lang === 'en') {
			res.render('static/collaborate-en');
		}else{
			res.render('static/collaborate');
		}
	});

	app.get('/contact', function(req, res){
		console.log('get /contact', req.query.success);
		if (req.session.lang === 'en') {
			res.render('static/contact-en', {success : req.query.success});
		}else{
			res.render('static/contact',{success : req.query.success});
		}
	});

	app.post('/contact', function(req, res){
		console.log('post /contact');
		var contact = _.extend({}, req.body);
		contact.type = 'contact';

		db.save(contact, function () {
			res.redirect('/contact?success=true');
		});
	});

	app.get('/documentation', function(req, res){
		if (req.session.lang === 'en') {
			res.render('static/documentation-en');
		}else{
			res.render('static/documentation');
		}
	});

	app.get('/criteria', function(req, res){
		if (req.session.lang === 'en') {
			res.render('static/criteria-en');
		}else{
			res.render('static/criteria');
		}
	});

	//User login with twitter
	app.get('/login', function (req, res) {
		res.render('login/index', {user : req.user});
	});

	app.get('/logout', function (req, res) {
		req.session.destroy();

		res.redirect('/');
	});

	app.use('/auth/twitter',passport.authenticate('twitter'), function(){});

	app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login?admin' }),
	function(req, res) {
		res.redirect('/admin/');
	});

	//Dictionary change
	app.get('/lang',function(req, res){
		if (req.session.lang === 'en') {
			req.session.lang = 'sp';
		}else{
			req.session.lang = 'en';
		}

		res.redirect(req.query.path);
	});

	app.dynamicHelpers({
		dictionary: function(req){
			return dictionaries[req.session.lang || 'sp'];
		},
		currentDictionary : function(req){
			return req.session.lang || 'sp';
		},
		env : function(){
			return process.env.NODE_ENV;
		}
	});

	//Clear session, simple and easy
	app.get('/clear', function(req, res){
		delete req.session.lang;

		res.redirect('/');
	});

	return app;
});