/* global define, jsPlumb, jsPlumbUtil, SVGAnimatedString */
/*
 * jsPlumb
 * 
 * Title:jsPlumb 1.5.3
 * 
 * Provides a way to visually connect elements on an HTML page, using either SVG, Canvas
 * elements, or VML.  
 * 
 * This file contains the Dojo adapter.
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


define([
    'dojo/dom', 'dojo/_base/window', 'dojo/_base/fx', 'dojo/_base/lang',
    'dojo/dom-geometry', 'dojo/dom-class', 'dojo/query',
    'dojo/dom-construct', 'dojo/dnd/Source', 'dojo/dnd/Target', 'dojo/dnd/Moveable', 'dojo/aspect', 'dojo/on',
    'dojo/NodeList-traverse', './jsPlumb', "./util"
],function(dom, win, fx, lang, geometry, domClass, query,
	   domConstruct, Source, Target, Moveable, aspect, on){	

    var _eventHandlers = new Object(); // for storing dojo event handler returned by on method
	var _draggables = new Object(); // for storing drag handles
	var _droppables = new Object();
	

	var _getElementObject = function(elIn)
	{
            // If el is already a DOM node, then el is returned.
	    var el = dom.byId(elIn);
	    console.assert(el,"dom.byId failed for ",elIn);
	    return el;
	};
	
	jsPlumb.CurrentLibrary = {
		
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
		 * appends the given child to the given parent. TODO: REMOVE!
		 */
		appendElement : function(child, parent) {
			
			 var pr = _getElementObject(parent);
			// domConstruct.place(child,pr[0]);
			 if(pr.length!=null)
				 domConstruct.place(child,pr[0]);
			 else
				 domConstruct.place(child,pr);
			 
			 //a.appendChild(child);
			//_getElementObject(parent).appendChild(child);			
		}, 
		
		/**
		 * event binding wrapper.  it just so happens that jQuery uses 'bind' also.  yui3, for example,
		 * uses 'on'.
		 */
		bind : function(elIn, event, callback) {
		    // YUI version explicitly goes through list of elements
		    // and binds each separately
		    console.assert(!(elIn instanceof Array),"dojo-adapter:  bind given an array: ", elIn);
		    var el = _getElementObject(elIn);
		    var result = on(el, event, callback);
		    console.assert(result, "dojo-adapter: bind failed for ", elIn, event);
		    _eventHandlers[el] = result;
		},
		
		destroyDraggable : function(el) {
                        // jQuery version also had a test for draggable
		        console.log("dojo-adapter:  destroyDraggable ", _draggables[el]);
			//destroy draggable in dojo
			_draggables[el].destroy();
		},
	
		destroyDroppable : function(el) {
                    // jQuery version also had a test for droppable
		    console.log("dojo-adapter:  destroyDroppable ", _draggables[el]);
		    //destroy droppable in Dojo
		    _droppables[el].destroy();
		},	

	    // mapping of drag events for Dojo  
	    // some of them are not in dojo eg. http://dojotoolkit.org/reference-guide/1.9/dojo/dnd/Moveable.html
	    dragEvents : {
		// Events from dojo/dnd/Moveable
		'start':'onMoveStart', 'stop':'onMoveStop', 'drag':'onMove', 
                // Need to find Dojo event for this:
                'step':'step',
                // Events associated with dojo/dnd/Target
               'over':'onDraggingOver', 'out':'onDraggingOut', 'drop':'onDrop', 
                // Need to find Dojo event for this:
                'complete':'complete'
	    },
		
/**
		 * wrapper around the library's 'extend' functionality (which it hopefully has.
		 * otherwise you'll have to do it yourself). perhaps jsPlumb could do this for you
		 * instead.  it's not like its hard.
		 */
		extend : function(o1, o2) {			
			return lang.mixin(o1,o2);
		},

/**
		*get XY co-ordinates of the client
*/		
		
		getClientXY : function(eventObject) {
		  return [eventObject.layerX, eventObject.layerY];
		},
		
		removeElement : function(element) {			
			_getElementObject(element).remove();
		},		

	        // Arguments are the arguments supplied to onMove
		getDragObject : function(moverPlus) {
		    console.warn("getDragObject not tested, argument = ", moverPlus);
			return moverPlus[0].node;
		},
		
		getDragScope : function(el) {
		        console.warn("getDragScope not implemented for Dojo");
			// return $(el).draggable("option", "scope");
		},

		getDropEvent : function(args) {
			return args[0];
		},
		
		getDropScope : function(el) {
		        console.warn("getDropScope not implemented for Dojo");
			// return $(el).droppable("option", "scope");		
		},
		
		/**
		* gets a DOM element from the given input, which might be a string (in which case we just do document.getElementById),
		* a selector (in which case we return el[0]), or a DOM element already (we assume this if it's not either of the other
		* two cases).  this is the opposite of getElementObject below.
		*/
		getDOMElement : function(el) {
		    if (el == null){
			console.warn("dojo-adapter: getDOMElement null");
			return null;
		    }
		    if (typeof(el) == "string"){
			var i = dom.byId(el);
			console.assert(i,"dom.byId failed for ",el);
			return i;
		    } else if (el.context || el.length != null) return el[0];
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
		getOriginalEvent : function(e) {
			return e;
		},
		
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
			return query('body')[0].scrollTop;
		},
//		TODO: search for method to get descendants in dojo
		
		getSelector : function(context, spec) {
            if (arguments.length == 2)
			     return query(spec, _getElementObject(context));
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
            getUIPosition : function(moverPlus, zoom) {
		zoom = zoom || 1;
		var place = geometry.position(moverPlus[0].node);
		return {left: place.x/zoom, top: place.y/zoom};
	    },	
		
		hasClass : function(el, clazz) {
			return domClass.contains(el, clazz);
		},
		isAlreadyDraggable : function(el) {
			return this.hasClass(_getElementObject(el), "dojoDndContainer");
		},
		
		/**
		 * initializes the given element to be droppable.
		 */
		initDraggable : function(elIn, options, isPlumbedComponent, _jsPlumb) {
			
			options = options || {};
		        var el = dom.byId(elIn);
                        console.assert(el, "dojo-adapter:  initDraggable bad element");

			// remove helper directive if present and no override
			if (!options.doNotRemoveHelper)
				options.helper = null;

         		 options.onMoveStart = jsPlumbUtil.wrap(options.onMoveStart, function() {
			       // This is identical to the jquery call
			       // See http://moresoda.co.uk/blog/article/dojo-and-jquery-side-by-side-dom-basics/
			       query("body").addClass(_jsPlumb.dragSelectClass);
			   }, false);
			

         		 options.onMoveStop = jsPlumbUtil.wrap(options.onMoveStop, function() {
				query("body").removeClass(_jsPlumb.dragSelectClass);
			    });

		        // Create new dnd/Moveable and then attach handlers to its methods.
			var moveableObject = new Moveable(el, {
			    handle:options.helper
			});

                    // BvdS:  I tried using dojo/on to connect handlers, but the event was never signalled.
		    aspect.after(moveableObject,"onMoveStart",function(){
			    console.log("**** onMoveStart event fired");
			    // arguments: mover
                            options.onMoveStart.apply(null, arguments);
		    },true);

		    aspect.after(moveableObject,"onMove",function(){
			    console.log("**** onMove event fired");
			    // arguments:  mover, leftTop
                            options.onMove.apply(null, arguments);
		    },true);

		    aspect.after(moveableObject,"onMoveStop",function(){
			     console.log("**** onMoveStop event fired");
			    // arguments:  mover
                            options.onMoveStop.apply(null, arguments);
		    },true);

			if (isPlumbedComponent){
			    console.warn("dojo-adapter.js: setting scope in initDroppable not tested");
			    // Setting movableObject.scope is just a wild guess ...
			    moveableObject.scope = options.scope || jsPlumb.Defaults.Scope;
                           }
		    
			_draggables[el]=moveableObject;
		},
		/**
		 * initializes the given element to be droppable.
		 */
		initDroppable : function(elIn, options) {

                   console.warn("initDroppable:  Dojo conversion not tested.");
		        var el = dom.byId(elIn);
                        console.assert(el, "dojo-adapter:  initDrappable bad element");

 		    options.scope = options.scope || jsPlumb.Defaults.Scope;
		    // similar to scope in jquery
		    var dropTarget = new Target(el,{accept:[options.scope]});  

		    aspect.after(dropTarget,"onDraggingOver",function(){
			    console.log("**** onDraggingOver event fired");
			    // no arguments
                            options.onDraggingOver.apply(null, arguments);
		    },true);

		    aspect.after(dropTarget,"onDraggingOut",function(){
			    console.log("**** onDraggingOut event fired");
			    // no arguments
                            options.onDraggingOut.apply(null, arguments);
		    },true);

		    aspect.after(dropTarget,"onDrop",function(){
			    console.log("**** onDrop event fired");
			    // arguments:  source, nodes, copy
                            options.onDrop.apply(null, arguments);
		    },true);

			_droppables[el]=dropTarget;
		},
		
		/**
		 * returns whether or not drag is supported (by the library, not whether or not it is disabled) for the given element.
		 */
		isDragSupported : function(el, options) {
                        console.warn("dojo-adapter: isDragSupporte not tested, ", el);
			//return $(el).draggable;
			//change this when solution is found out
			return true;
		},				
		setDragFilter : function(el, filter) {
		}	
		,
		setDraggable : function(el, draggable) {
                        console.warn("dojo-adapter: setDraggable not implemented, args=", el, draggable);
			//el.draggable("option", "disabled", !draggable);
			//if(!draggable)
			  // _draggables[el]=new Source(el);
		}
		,
		/**
		 * returns whether or not drop is supported (by the library, not whether or not it is disabled) for the given element.
		 */
		isDropSupported : function(el, options) {
                        console.warn("dojo-adapter: isDropSupported not tested, ", el);
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

		setOffset : function(el, o) {
			el=_getElementObject(el);
			el.offsetTop=o.top;
			el.offsetLeft=o.left;
		},

		trigger : function(el, event, originalEvent) {
                        console.warn("dojo-adapter:  trigger not implemented, args=", el, event, originalEvent);
			//var h = jQuery._data(_getElementObject(el)[0], "handle");
            //h(originalEvent);
		},
		unbind : function(el, event, callback) {
			el = _getElementObject(el);
			_eventHandlers[el].remove();
		}
	};
});






