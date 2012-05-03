$(document).ready(function(){        	
    var structure = {
        header : ['title','author','publisher','distributor','bibl'],
        front  : ['pb','docTitle'],
        tags   : ['name','term','abbr','cit','q','foreign','date']
    };
    
    Parser.setStructure(structure);
});

