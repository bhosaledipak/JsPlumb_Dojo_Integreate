/*
 *  This file contains the JS that handles the first init of each jQuery demonstration, and also switching
 *  between render modes.
 */

require(['dojo/ready','dojo/dom','dojo/dom-class','dojo/dom-attr','dojo/query'],function(ready,dom,domclass,dom_attr,query){

ready(function(){
	
	jsPlumb.init();
//	var a = query("#window1");
//	var b = a.children();
	  jsPlumb.DemoList.init();
	  jsPlumbDemo.init();
	
}); 	
  
  
  

	
});








       
