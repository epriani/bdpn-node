var requirejs = require('requirejs'),
	flatiron  = require('flatiron'),
	fs        = require('fs'),
    app       = new flatiron.App(),
    Parser    = require("teiparser").Parser;

Parser.setStructure({
	header : ['title','author','publisher','distributor','bibl'],
    front  : ['pb','docTitle'],
    tags   : ['name','term','abbr','cit','q','foreign','date']	
});

requirejs.config({
    baseUrl: 'app',
    nodeRequire: require
});

requirejs(['db','models/terms'],
function (db, terms) {
    app.use(flatiron.plugins.cli, {
        usage : [
            'I would say RTFM, but you would say, write the fucking manual'
        ],        
        argv: {
            file: {
                alias: 'f'
            },
            book : {},
            bookId : {
                alias: 'b'
            },
            revisionId : {
                alias: 'r'  
            },
            author : {}
        }
    });	

    app.cmd('start',function () {
        var server = requirejs('server');
        console.log('start server');

        server.listen(8080);
        console.log('Server ready at 8080');
    });    


    // node app createBook --book "ESPECULACION ASTROLOGICA, Y PHYSICA DE LA NATURALEZA DE LOS COMETAS, Y JUIZIO DEL QUE ESTE Año de 1682 Se vè en todo el Mundo" --author "Gaspar Juan Evelino"
    app.cmd('bookCreate',function () {
        var book = {
            type : "book",
            name : app.argv.book,            
            author : app.argv.author
        }

        db.save(book, function (err, doc) {
            if(err){
                console.log("************************************");
                console.log("There was an creating saving the book");
                console.log(err);
                console.log("************************************");
            }else{
                console.log('Book saved', doc._id);
            }
        });
    });

    app.cmd('bookAddAttachment', function(){
        var bookId   = app.argv.bookId,
            fileName = app.argv.file,
            file     = fs.readFileSync(app.argv.file).toString();

        if(!bookId || !fileName){
            console.log('You need to provide a bookId and a fileName');
            return;
        }

        console.log('adding attachment to book', bookId, fileName); 

        db.get(bookId, function(err, doc){
            if(err){
                console.log(err);
                return;
            }

            console.log(doc);

            db.addAttachment(doc, {
                name : fileName,
                body : file
            },function(err, result){
                console.log('attachment callback')
                console.log(err, result);
            });
        });
    });

    app.cmd('booksList',function () {
        console.log('');
        console.log('Books:');

        db.view('books/list', function (err, docs) {
            var doc;

            for (var i = 0; i < docs.length; i++) {
                doc = docs[i]
                console.log(doc.id, doc.value.substr(0,70) + "..");
            };
            console.log('');
        });
    });

    // node app booksInfo -b 9029ed07d153210314e74b1f97003264
    app.cmd('booksInfo',function () {
        var bookId   = app.argv.bookId;

        if(!bookId){
            console.log('You need a bookId');
            return;
        }         

        db.view('books/info', { 
            startkey     : [bookId],
            endkey       : [bookId, 1]
        }, function (err, docs) {
            if(err){
                console.log("************************************");
                console.log("There was an error getting book info");
                console.log(err);
                console.log("************************************");
            }else{
                var doc, date;

                for (var i = 0; i < docs.length; i++) {
                    doc = docs[i];
                    if( doc.key[1] === 0){
                        console.log('**',doc.value);
                    }else{
                        (date = new Date).setTime(doc.value);
                        console.log(i +'.-', date.toGMTString(), doc.id);
                    }
                };
            }
        });
    });

    // node app booksPublish -b 9029ed07d153210314e74b1f97003264 -r 0cb74c7f3ce7ba73034e04e809000652
    app.cmd('booksPublish',function () {
        var revisionId = app.argv.revisionId,
            bookId     = app.argv.bookId;

        if(!bookId || !revisionId){
            console.log('You need a bookId and a revisionId');
            return;
        }        

        console.log('Publishing', bookId, revisionId);

        db.get(revisionId,function(err,revision){
            if(err || revision.bookId != bookId){
                console.log('Book and revision.bookId dont Match', err);
                return;
            }

            revision.publish = true;
            db.save(revision._id, revision._rev, revision, function(err,doc){
                err ? console.log('Err on revision update', err) :
                      console.log('Revision update completed');
            });

            db.get(bookId, function(err,book){
                console.log('book:',book);                

                if(book.revisionId && book.revisionId != revisionId){
                    console.log('Need to remove old review');
                    db.get(book.revisionId, function(err, doc){
                        if(err){
                            console.log('something went wrong removing the old publish');
                            return;
                        }

                        doc.publish = false;
                        db.save(doc.id, doc._rev, doc);
                        console.log('old revision unpublished')
                    });
                }

                book.revisionId = revisionId;
                db.save(book._id, book.rev, book, function(err,doc){
                    err ? console.log('Err on revision update', err) :
                          console.log('Boook update completed');
                });
            });            
        });
    });

    // node app save -f 62.xml -b 9029ed07d153210314e74b1f97003264
    app.cmd('save',function () {
    	var fileName = app.argv.file,
            bookId   = app.argv.bookId,
    		tei      = fs.readFileSync(app.argv.file).toString(),
			parser   = new Parser(tei);

        if(!bookId || !fileName){
            console.log('You need a bookId and a fileName');
            return;
        }

        var parsedTei = parser.getTei();

        parsedTei.type = 'revision';
        parsedTei.bookId = bookId;
        parsedTei.parseDate = (new Date).getTime();

		db.save(parsedTei, function (err, doc) {
            if(err){
                console.log("************************************");
                console.log("There was an error saving the book");
                console.log(err);
                console.log("************************************");
            }else{
                console.log('Revision saved', doc._id);
            }
		});
    });

    // node app testParser -f teis/62.xml -b 9029ed07d153210314e74b1f97003264
    app.cmd('testParser',function () {
        var fileName = app.argv.file,
            tei      = fs.readFileSync(app.argv.file).toString(),
            parser   = new Parser(tei),
            util     = require('util');
        
        var parsedTei = parser.getTei();        
        
        console.log( util.inspect( parser.getFolios(), false, 4 ) );
    });

    app.cmd('getUsedTerms', function(){
        console.log('terms intance', terms); 

        console.log('used terms', terms.getUsedTerms() );
    });

    //If no routes passed, uses default "start";
    if(!app.argv._.length && !app.argv.help){
        console.log('app.argv', app.argv.help );
        app.argv._ = ["start"];
    }

    app.start();    
});