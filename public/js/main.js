$(document).ready(function () {
	$('#language').click(function(e){
		var path   = location.pathname,
			origin = location.origin;

		e.preventDefault();

		location = origin + '/lang?path=' + path;
	});
});