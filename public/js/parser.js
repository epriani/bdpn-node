(function (global) {
	if(typeof process !== 'undefined'){
		var _       = require("underscore"),
			cheerio = require("cheerio"),
			sha1    = require('./dep/sha1').sha1,
			$ = cheerio.load();
		//... Node dependencies
	}else{
		//... Browser dependencies
		var $ = window.$,
			_ = window._,
			sha1 = window.SHA1;
	}

	var Parser = function (raw) {
		this.raw = raw;
		this.teiAsDom = $(raw);
		this.isParser = true;
		this.structure = this.constructor.structure;
	}

	Parser.setStructure = function(structure){
		this.structure = structure;
	}

	Parser.prototype._hashFolio = function(tag){
		var pb = tag.find('pb').text(),
			id;

		if(pb){
			id = window.sha1( pb.replace(/\W/g,'').toLowerCase() );
		}else{
			id = window.sha1( tag.text().replace(/\W/g,'').toLowerCase() );
		}

		return id;
	}

	Parser.prototype._closest = function(el, tag){
		while( el.parent() && el.parent()[0].name !== tag){
			el = el.parent();
		}

		return el.parent();
	}

	Parser.prototype.getSchema = function(){
		var $tei = this.teiAsDom;
		var schema = $tei.find('schemaSpec').find('moduleRef').map(function(i, item) { return $(item).attr('key'); });//.toArray();

		return schema.toArray ? schema.toArray() : schema;
	}

	Parser.prototype.getHeader = function(){
		var header = {},
			$tei = this.teiAsDom,
			$header = $tei.find('teiHeader');

		header.raw = $header.html();

		_.each( this.structure.header ,function(item,i){
			header[item] = $header.find(item).text()
		});

		return header;
	}

	Parser.prototype.getFront = function(){
		var front = {},
			$tei = this.teiAsDom,
			$front = $tei.find('front');

		front.raw = $front.html();		

		_.each( this.structure.front ,function(item,i){
			front[item] = $front.find(item).text()
		});

		return front;
	}

	Parser.prototype.getFolios = function(){
		var folios      = {},
			tempRaw     = this.raw,
			$tei        = $(tempRaw),
			$folios     = $tei.find('text div'),
			tags        = this.structure.tags,
			lineCounter = 0,
			parser      = this;			

		folios = $folios.map(function(i,item){
			var folio = {},
				$item = $(item);

			if( $item.find('front').length ){
				folio.isFront = true;
			}

			folio.pb    = $item.find('pb').text();
			folio.hash  = parser._hashFolio($item);
			
			$item.find('pb').remove();

			folio.raw   = $item.html().trim();
			folio.lines = folio.raw.split('\n').length;
			folio.startLine = lineCounter;

			folio.tags = $item.find(tags.join(',')).map(function(i,teiTag){
				var tag = {},
					$tag = $(teiTag);

				tag.tag 	= teiTag.nodeName.toLowerCase();
				tag.content = $tag.text().trim();
				$tag.attr('reg')  ? tag.reg  = $tag.attr('reg') : null;
				$tag.attr('type') ? tag.type = $tag.attr('type').toLowerCase() : null;
				tag.id      = window.sha1( ( tag.type + (tag.reg || tag.content).replace(/\W/g,'') ).toLowerCase());

				return tag
			});

			folio.tags = folio.tags.toArray ? folio.tags.toArray() : folio.tags;
			lineCounter += folio.lines;


			return folio;
		});

		return folios.toArray ? folios.toArray() : folios;
	}

	Parser.prototype.getHeads = function() {
		var heads   = [],
			tempRaw = this.raw,
			$tei    = $(tempRaw),
			parser  = this;

					
		$tei.find('head').map(function(i,headTag){
			var head  = {},
				$head = $(headTag),
				folio = parser._closest( $head, 'div' );

			head.content = $head.text().replace('\n',' ');
			head.folio   = parser._hashFolio(folio);

			heads.push(head);
		});

		return heads;
	};

	Parser.prototype.getTei = function(){
		var tei = {};

		tei.schema = this.getSchema();
		tei.header = this.getHeader();
		tei.front  = this.getFront();
		tei.heads  = this.getHeads();
		tei.folios = this.getFolios();

		return tei;
	}

	global.Parser = Parser;
}(typeof window  === 'undefined' ? exports : window));