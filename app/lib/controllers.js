define(function () {
	var Controller = function(config){
		var routes = {},
			prefix = config.prefix || '/';

		var controller =  function(app){
			for(var path in routes){
				var route = routes[path];
				app[route.method](path, route.callback);
			}
		};

		controller.add = function(route, method, callback){
			var routeHandler = function(req, res){
				if(req.query.asJson){
					res.render = function(view, data){
						if(req.query.callback){
							var viewData = req.query.callback + '(' + JSON.stringify(data) + ');'
						}else{
							var viewData = JSON.stringify(data);
						}

						res.send(viewData);
					}
				}

				callback(req, res);
			}

			routes[prefix + route] = {
				method   : method,
				callback : routeHandler
			}
		};

		controller.get = function(route, callback){
			this.add(route, 'get', callback);
			return this;
		};

		controller.post = function(route, callback){
			this.add(route, 'post', callback);
			return this;
		};

		controller.put = function(route, callback){
			this.add(route, 'get', callback);
			return this;
		};

		controller.delete = function(route, callback){
			this.add(route, 'get', callback);
			return this;
		};

		return controller;
	}

	return Controller;
});