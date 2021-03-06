define(['lib/controllers', 'db', 'models/terms'], function (Controller, db, termsModel) {

    var api = Controller({prefix : '/api'}),
            _   = require('underscore');

    api.get('/books/', function(req,res){
        res.render('test',{ asJson : true, data : 'lol' });
    });

    api.get('/:bookId/tags', function(req, res){
        var tagsInBook = termsModel.indexesByBook[req.params.bookId];

        if(req.query.callback){
            tagsInBook = req.query.callback + '(' + JSON.stringify(tagsInBook) + ');';
        }        

        res.send(tagsInBook);

        // var tags = {};
        // db.get(req.params.bookId, function (err, book) {
        //     if(err) res.send(err);
        //     db.get(book.revisionId, function (err, rev) {
        //         if(err) res.send(err);

        //         rev.folios.forEach(function(folio){
        //             if(!folio.tags) return;

        //             folio.tags.forEach(function(item){
        //                 if(!tags[item.tag]){
        //                     tags[item.tag] = [];
        //                 }

        //                 tags[item.tag].push(item);
        //             });
        //         });

        //         if(req.query.callback){
        //             tags = req.query.callback + '(' + JSON.stringify(tags) + ');';
        //         }

        //         res.send(tags);
        //     });
        // });
    });

    return api;
});