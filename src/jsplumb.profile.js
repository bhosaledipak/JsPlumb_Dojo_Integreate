var profile = (function(){
	var testResourceRe = /^dojo\/tests\//,

		copyOnly = function(filename, mid){
			var list = {
				"jsPlumb/jsPlumb.profile":1,
				"jsPlumb/package.json":1,
				"jsPlumb/overlays-guidelines":1
			};
			return (mid in list) ||
				/^dojo\/_base\/config\w+$/.test(mid) ||
				(/^dojo\/resources\//.test(mid) && !/\.css$/.test(filename)) ||
				/(png|jpg|jpeg|gif|tiff)$/.test(filename) ||
				/built\-i18n\-test\/152\-build/.test(mid);
		};
	isExcluded = function(filename, mid){
		var list = {
			"jsPlumb/jquery-adapter":1
		}
		return mid in list;

	};
	return {
		resourceTags:{
			test: function(filename, mid){
				return testResourceRe.test(mid);
			},

			copyOnly: function(filename, mid){
				return copyOnly(filename, mid);
			},

			amd: function(filename, mid) {
				return /\.js$/.test(filename) && !copyOnly(filename, mid);
			},

			miniExclude: function(filename, mid){
				return isExcluded(filename, mid);
			}
		}
	};
})();
