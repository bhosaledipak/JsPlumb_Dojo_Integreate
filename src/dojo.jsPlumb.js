
/*
 * jsPlumb
 * 
 * Title:jsPlumb 1.5.3
 * 
 * Provides a way to visually connect elements on an HTML page, using either SVG, Canvas
 * elements, or VML.  
 * 
 * This file contains the jQuery adapter.
 *
 * Copyright (c) 2010 - 2013 Simon Porritt (http://jsplumb.org)
 * 
 * http://jsplumb.org
 * http://github.com/sporritt/jsplumb
 * http://code.google.com/p/jsplumb
 * 
 * Dual licensed under the MIT and GPL2 licenses.
 */ 
/* 
 * the library specific functions, such as find offset, get id, get attribute, extend etc.  
 * the full list is:
 * 
 * addClass				adds a class to the given element
 * animate				calls the underlying library's animate functionality
 * appendElement		appends a child element to a parent element.
 * bind					binds some event to an element
 * dragEvents			a dictionary of event names
 * extend				extend some js object with another.  probably not overly necessary; jsPlumb could just do this internally.
 * getDragObject		gets the object that is being dragged, by extracting it from the arguments passed to a drag callback
 * getDragScope			gets the drag scope for a given element.
 * getDropScope			gets the drop scope for a given element.
 * getElementObject		turns an id or dom element into an element object of the underlying library's type.
 * getOffset			gets an element's offset
 * getOriginalEvent     gets the original browser event from some wrapper event
 * getPageXY			gets the page event's xy location.
 * getParent			gets the parent of some element.
 * getScrollLeft		gets an element's scroll left.  TODO: is this actually used?  will it be?
 * getScrollTop			gets an element's scroll top.  TODO: is this actually used?  will it be?
 * getSize				gets an element's size.
 * getUIPosition		gets the position of some element that is currently being dragged, by extracting it from the arguments passed to a drag callback.
 * hasClass				returns whether or not the given element has the given class.
 * initDraggable		initializes an element to be draggable 
 * initDroppable		initializes an element to be droppable
 * isDragSupported		returns whether or not drag is supported for some element.
 * isDropSupported		returns whether or not drop is supported for some element.
 * removeClass			removes a class from a given element.
 * removeElement		removes some element completely from the DOM. 
 * setDragFilter		sets a filter for some element that indicates areas of the element that should not respond to dragging.
 * setDraggable			sets whether or not some element should be draggable.
 * setDragScope			sets the drag scope for a given element.
 * setOffset			sets the offset of some element.
 * trigger				triggers some event on an element.
 * unbind				unbinds some listener from some element.
 */


require(['dojo/dom','dojo/_base/fx','dojo/on','dojo/_base/lang','dojo/dom-geometry','dojo/dom-class','dojo/query','dojo/dom-construct','dojo/dnd/Source','dojo/on','dojo/NodeList-traverse'],
function(dom,fx,on, lang,geometry,domClass,query,domConstruct,source,on){
	
	/*
	var _getElementObject = function(el)
	{
		return dom.byId(el);
	};*/
	
	
	var _getElementObject = function(el)
	{
		
		//return typeof(el) == "string" ? dom.byId(el) : dom.byId(el.id);
		return dom.byId(el);
		//return typeof(el) == "string" ? dom.byId(el) : el.id!=null ? dom.byId(el.id) : dom.byId(el);
	};
	
	jsPlumb.CurrentLibrary = {
		
		
				/**
		 * adds the given class to the element object.
		 */
		addClass : function(el, clazz) {
			el = _getElementObject(el);
			try {
				if (el[0].className.constructor == SVGAnimatedString) {
					jsPlumbUtil.svg.addClass(el[0], clazz);                    
				}
			}
			catch (e) {
				// SVGAnimatedString not supported; no problem.
			}
            try {                
                el.addClass(clazz);
            }
            catch (e) {
                // you probably have jQuery 1.9 and Firefox.  
            }
		},
		
		/**
		 * animates the given element.
		 */
		animate : function(el, properties, options) {
			fx.animateProperty(
				{
					node:el,
					properties: properties
					
				}
			
			
			).play();
		},
		
		/**
		 * appends the given child to the given parent.

TODO: REMOVE!

		 */
		appendElement : function(child, parent) {
			
			 var pr = _getElementObject(parent);
			 domConstruct.place(child,pr[0]);
			 //a.appendChild(child);
			//_getElementObject(parent).appendChild(child);			
		}, 
		
		/**
		 * event binding wrapper.  it just so happens that jQuery uses 'bind' also.  yui3, for example,
		 * uses 'on'.
		 */
		bind : function(el, event, callback) {
			el = _getElementObject(el);
			on(el, event, callback);
		},
		
/*		
TODO: modify this later
		destroyDraggable : function(el) {
		if ($(el).data("draggable"))
		    $(el).draggable("destroy");
		}, 
		
		destroyDroppable : function(el) {
			if ($(el).data("droppable"))
				$(el).droppable("destroy");
		},
*/	
       //   mapping of drag events for jQuery  
		dragEvents : {
			'start':'start', 'stop':'stop', 'drag':'drag', 'step':'step',
			'over':'over', 'out':'out', 'drop':'drop', 'complete':'complete'
		},		
		
		
		

/**
		 * wrapper around the library's 'extend' functionality (which it hopefully has.
		 * otherwise you'll have to do it yourself). perhaps jsPlumb could do this for you
		 * instead.  it's not like its hard.
		 */
		extend : function(o1, o2) {
			
			return lang.mixin(o1,o2);
		//	return lang.extend(o1, o2);
		},

/**
		*get XY co-ordinates of the client
*/		
		
		getClientXY : function(eventObject) {
		  return [eventObject.layerX, eventObject.layerY];
		},
		
		
				/**
		 * takes the args passed to an event function and returns you an object representing that which is being dragged.
		 */
		 /*
		 
		 TODO: Do this later
		getDragObject : function(eventArgs) {
			return eventArgs[1].draggable || eventArgs[1].helper;
		},
		
		getDragScope : function(el) {
			return $(el).draggable("option", "scope");
		},

		getDropEvent : function(args) {
			return args[0];
		},
		
		getDropScope : function(el) {
			return $(el).droppable("option", "scope");		
		},*/
		
		/**
		* gets a DOM element from the given input, which might be a string (in which case we just do document.getElementById),
		* a selector (in which case we return el[0]), or a DOM element already (we assume this if it's not either of the other
		* two cases).  this is the opposite of getElementObject below.
		*/
		getDOMElement : function(el) {
			if (el == null) return null;
			if (typeof(el) == "string") return dom.byId(el);
			else if (el.context || el.length != null) return el[0];
			else return el;
		},
		
				/**
		 * gets an "element object" from the given input.  this means an object that is used by the
		 * underlying library on which jsPlumb is running.  'el' may already be one of these objects,
		 * in which case it is returned as-is.  otherwise, 'el' is a String, the library's lookup 
		 * function is used to find the element, using the given String as the element's id.
		 * 
		 */		
		getElementObject : _getElementObject,
 
 
 /**
		  * gets the offset for the element object.  this should return a js object like this:
		  *
		  * { left:xxx, top: xxx }
		 */
		getOffset : function(el) {
			
			var o = geometry.position(el); 
			return {left:o["x"], top:o["y"]};
			//return geometry.position(el);
			
		},

/**		
TODO: find jquery equivalent original event in dojo
		getOriginalEvent : function(e) {
			return e.originalEvent;
		}, **/
		
		getPageXY : function(eventObject) {
			return [eventObject.pageX, eventObject.pageY];
		},
		
		getParent : function(el) {
			
			return query("#"+_getElementObject(el).id).parent();
		},
		
		getScrollLeft : function(el) {
			return geometry.scrollLeft(el);
		},
		
		getScrollTop : function(el) {
			return dojo.query('body')[0].scrollTop;
		},
		
		


//		TODO: search for method to get descendants in dojo
		
		getSelector : function(context, spec) {
            if (arguments.length == 2)
                return _getElementObject(context).find(spec);
            else
                return query(context);
		}, 
		
		/**
		 * gets the size for the element object, in an array : [ width, height ].
		 */
		getSize : function(el) {
			var wh = geometry.position(el);
			return [wh.w, wh.h];
		},

        getTagName : function(el) {
            var e = _getElementObject(el);
            return e.length > 0 ? e[0].tagName : null;
        },
        
        /**
		 * takes the args passed to an event function and returns you an object that gives the
		 * position of the object being moved, as a js object with the same params as the result of
		 * getOffset, ie: { left: xxx, top: xxx }.
		 * 
		 * different libraries have different signatures for their event callbacks.  
		 * see getDragObject as well
		 */
		getUIPosition : function(eventArgs, zoom) {
			
			zoom = zoom || 1;
			// this code is a workaround for the case that the element being dragged has a margin set on it. jquery UI passes
			// in the wrong offset if the element has a margin (it doesn't take the margin into account).  the getBoundingClientRect
			// method, which is in pretty much all browsers now, reports the right numbers.  but it introduces a noticeable lag, which
			// i don't like.
            
			/*if ( getBoundingClientRectSupported ) {
				var r = eventArgs[1].helper[0].getBoundingClientRect();
				return { left : r.left, top: r.top };
			} else {*/
			if (eventArgs.length == 1) {
				ret = { left: eventArgs[0].pageX, top:eventArgs[0].pageY };
			}
			else {
				var ui = eventArgs[1],
				  _offset = {left:geometry.position(el).x, top:geometry.position(el).y};
				  
				ret = _offset || ui.absolutePosition;
				
				// adjust ui position to account for zoom, because jquery ui does not do this.
				ui.position.left /= zoom;
				ui.position.top /= zoom;
			}
            return { left:ret.left / zoom, top: ret.top / zoom };
		},		
		
		hasClass : function(el, clazz) {
			return domClass.hasClass(el, clazz);
		},
		
		
		/**
		 * initializes the given element to be droppable.
		 */
		initDraggable : function(el, options, isPlumbedComponent, _jsPlumb) {
			options.scope = options.scope || jsPlumb.Defaults.Scope;
			
			//generate a source to be droppable
			var dropSource = new source(_getElementObject(el));
			
			on(dropSource, "onDraggingOver",options.over);
			on(dropSource, "onDraggingOut",options.out);
			//$(el).droppable(options);
		},
		
		
		/**
		 * initializes the given element to be droppable.
		 */
		initDroppable : function(el, options) {
			options.scope = options.scope || jsPlumb.Defaults.Scope;
			
			//generate a source to be droppable
			var dropSource = new source(_getElementObject(el));
			
			on(dropSource, "onDraggingOver",options.over);
			on(dropSource, "onDraggingOut",options.out);
			//$(el).droppable(options);
		},
		
		/**
		 * returns whether or not drag is supported (by the library, not whether or not it is disabled) for the given element.
		 */
		isDragSupported : function(el, options) {
			//return $(el).draggable;
			//change this when solution is found out
			return true;
		},				
						
		/**
		 * returns whether or not drop is supported (by the library, not whether or not it is disabled) for the given element.
		 */
		isDropSupported : function(el, options) {
			
			//return $(el).droppable;
			//change this when solution is found out
			return true;
		},	
		
		
		/**
		 * removes the given class from the element object.
		 */
		removeClass : function(el, clazz) {
			el = _getElementObject(el);
			try {
				if (el[0].className.constructor == SVGAnimatedString) {
					jsPlumbUtil.svg.removeClass(el[0], clazz);
                    return;
				}
			}
			catch (e) {
				// SVGAnimatedString not supported; no problem.
			}
			
			domClass.remove(el,clazz);
		},
		
        
        
	};
	
	
	
	
	
});






