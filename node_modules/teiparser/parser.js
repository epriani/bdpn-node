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
		var folios = {},
			$tei = this.teiAsDom,
			$folios = $tei.find('text div'),
			tags = this.structure.tags;			

		folios = $folios.map(function(i,item){
			var folio = {},
				$item = $(item);

			if( $item.find('front').length ){
				return;
			}

			folio.pb   = $item.find('pb').text();
			folio.raw  = $item.find('p').html().trim();
			folio.hash = sha1($item.text().replace(/\W/g,'').toLowerCase());

			folio.tags = $item.find(tags.join(',')).map(function(i,teiTag){
				var tag = {},
					$tag = $(teiTag);

				tag.tag 	= teiTag.nodeName;
				tag.content = $tag.text();
				tag.reg     = $tag.attr('reg');
				tag.type    = $tag.attr('type');
				tag.id      = sha1( ( tag.type + (tag.reg || tag.content).replace(/\W/g,'') ).toLowerCase());

				return tag
			});

			folio.tags = folio.tags.toArray ? folio.tags.toArray() : folio.tags;

			return folio;
		});

		return folios.toArray ? folios.toArray() : folios;
	}

	Parser.prototype.getTei = function(){
		var tei = {};

		tei.schema = this.getSchema();
		tei.header = this.getHeader();
		tei.front  = this.getFront();
		tei.folios = this.getFolios();

		return tei;
	}

	global.Parser = Parser;
}(typeof window  === 'undefined' ? exports : window));