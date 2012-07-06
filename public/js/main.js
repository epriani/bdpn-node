$(document).ready(function () {
	$('#language').click(function(e){
		var path   = location.pathname,
			origin = location.origin;

		e.preventDefault();

		location = origin + '/lang?path=' + path;
	});

	$('#contacto').submit(function(){
		console.log('form been submited');
	});

	$('#enviar').click(function(){
		console.log('click on submit');
	});	
});