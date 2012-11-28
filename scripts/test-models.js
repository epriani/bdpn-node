var requirejs = require('requirejs');

requirejs.config({
    baseUrl: 'app',
    nodeRequire: require
});

requirejs(['models/user'], function(User){
	console.log( (new Date).getTime() );
	console.log('Model',User);
});