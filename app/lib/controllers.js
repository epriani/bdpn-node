define(function () {
	var Controller = function(config){
		var routes = {},
			prefix = config.prefix || '/';

		var controller =  function(app){
			for(var path in routes){
				var route = routes[path];
				app[route.method](route.path, route.callback);
			}
		};

		controller.add = function(route, method, callback){
			var routeHandler = function(req, res){
				console.log('got request to ', method, route);
				if(req.query.asJson){
					res.show = function(view, data){
						var viewData;
						if(req.query.callback){
							viewData = req.query.callback + '(' + JSON.stringify(data) + ');';
						}else{
							viewData = JSON.stringify(data);
						}

						res.send(viewData);
					};
				}else{
					res.show = function (view, data) {
						data = data || {};
						data.viewData = JSON.stringify(data)  || '{}';

						res.render(view, data);
					};
				}

				callback(req, res);
			};

			routes[prefix + route + method] = {
				path     : prefix + route,
				method   : method,
				callback : routeHandler
			};
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