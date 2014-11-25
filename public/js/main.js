window.location.searchToObject = function () {
	var pairs = this.search.substring(1).split("&"),
		obj = {},
		pair,
		i;

	for ( i in pairs ) {
		if ( pairs[i] === "" ) continue;

		pair = pairs[i].split("=");
		obj[ decodeURIComponent( pair[0] ) ] = decodeURIComponent( pair[1] );
	}

  	return obj;
}

$(document).ready(function () {
	$('[id^="language-"]').click(function(e){
		var path   = location.pathname,
			origin = location.origin,
			lang   = $(e.currentTarget).attr('id').substr(-2, 2);

		e.preventDefault();

		location = origin + '/lang?path=' + path + '&lang=' + lang;
	});

	$('#contacto').submit(function(){
		console.log('form been submited');
	});

	$('#enviar').click(function(){
		console.log('click on submit');
	});	
});