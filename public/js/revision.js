(function(global){
	console.log('loading revision utils');
	var revision = {};

	global.revision = revision;
	global.warningCount = 0;
	var allowedStructure = window.data.structure;

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
			var html, $html;

			folio.content = folio.raw.replace(/\n/g, '<br>');
			folio.tags    = folio.tags || {};

			if(folio.isFront){
				html = frontTemplate.render(folio);
			}else{
				html = folioTemplate.render(folio);

				$html = $(html);

				folio.tags && folio.tags.forEach && folio.tags.forEach(function(item){
					var warningHtml;

					if(!allowedStructure[item.tag]){
						$html.find('.tags .'+ item.tag ).css('color', 'red');
						$html.find('.content ' + item.tag).css('color', 'red');

						global.warningCount++;

						warningHtml = warningTemplate.render({
							message : 'Invalid tag:'+ item.tag,
							content : item.content
						});

						$html.find('.warnings').append(warningHtml);

						return;
					}

					if(!allowedStructure[item.tag][item.type || 'plain']){
						$html.find('.tags .'+ item.tag + '[type="'+ (item.type || 'plain') +'"]').css('color', 'red');
						$html.find('.content ' + item.tag + '[type="'+ (item.type) +'"]').css('color', 'red');

						global.warningCount++;

						warningHtml = warningTemplate.render({
							message : 'Invalid tag type:'+ item.tag +'::'+ item.type,
							content : item.content
						});

						$html.find('.warnings').append(warningHtml);

						return;
					}
				});
			}

			html = $html || $(html);

			target.append(html);

			html.find('.tags').css('top', html.find('.warnings').height() + 35 );

			if( html.find('.tags').height() + html.find('.warnings').height() + 15 > html.height() ){
				html.height( html.find('.tags').height() + html.find('.warnings').height() + 55 );
			}
		});

		if(global.warningCount){
			$('#revision-container').prepend('<div class="warning"><span>Warning Count: '+ global.warningCount +'</span></div>');
		}
	};

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