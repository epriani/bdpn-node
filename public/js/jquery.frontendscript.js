
$(document).ready(function(){

$('a.top').click(function(){
	$('html, body').animate({scrollTop:0}, 'slow');
	return false;
});

/*
$(document).scroll(function(e) {
    var scrollTop = $(this).scrollTop();
    if( scrollTop >= 300 ) {
        $('#folios').removeClass('foliaje').addClass('fofijo');
    } else {
    	 $('#folios').removeClass('fofijo').addClass('foliaje');
    }
});
*/

var allPanels = $('dl.accordion > dd').hide();

$('.accordion > dt > a').click(function() {
	$target =  $(this).parent().next();
	if(!$target.hasClass('active')){
		allPanels.removeClass('active').slideUp();
		$target.addClass('active').slideDown();
	}
      
    return false;
});
  
  
});






















