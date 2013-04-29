define(['lib/controllers', 'db'], function (Controller, db) {
    console.log('Api added');
    var api = Controller({prefix : '/api'}),
            _   = require('underscore');

    api.get('/books/', function(req,res){
        res.render('test',{ asJson : true, data : 'lol' });
    });

    api.get('/:bookId/tags', function(req, res){
        var tags = {};
        db.get(req.params.bookId, function (err, book) {
            if(err) res.send(err);
            db.get(book.revisionId, function (err, rev) {
                if(err) res.send(err);

                rev.folios.forEach(function(folio){
                    if(!folio.tags) return;

                    folio.tags.forEach(function(item){
                        console.log(item);

                        if(!tags[item.tag]){
                            tags[item.tag] = [];
                        }

                        tags[item.tag].push(item);
                    });
                });

                res.send(tags);
            });
        });
    });

    return api;
});