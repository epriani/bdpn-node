(function(global){
	console.log('loading revision utils')
	var revision = {};

	global.revision = revision;

	revision.render = function (revision, target) {
		var schema = schemaTemplate.render({
			isTeiLite : window.revision.isTeiLite(revision.schema),
			schema    : revision.schema.toString()
		});	
		target.append(schema);

		var header = $( headerTemplate.render({header : revision.header}) );
		target.append(header);

		if( header.find('.tags').height() > header.height() ){
			header.height( header.find('.tags').height() + 20);
		}


		revision.folios.forEach(function (folio) {
			folio.content = folio.raw.replace(/\n/g, '<br>')
			folio.tags    = folio.tags || {};

			if(folio.isFront){
				var html = frontTemplate.render(folio);				
			}else{
				var html = folioTemplate.render(folio);				
			}

			html = $(html);

			target.append(html);
			if( html.find('.tags').height() > html.height() ){
				html.height( html.find('.tags').height() + 20);
			}			

		});
	}

	revision.isTeiLite = function(keys){
		if(    keys.indexOf("tei") >= 0 
			&& keys.indexOf('header') >= 0  
			&& keys.indexOf('core') >= 0 
			&& keys.indexOf('textstructure') >= 0 
			&& keys.indexOf('namesdates') >= 0)
		{
			return true;
		}else{
			return false;
		}
	}
	

})(window);