(function() {

	var editor = {};

	var codeMirror = CodeMirror(document.getElementById('editor'), {
		mode: 'gfm',
		lineNumbers: true,
		lineWrapping: true,
		theme: "nicemark",
		autofocus: true,
		foldGutter: true,
		scrollPastEnd: true,
		gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
		extraKeys: {
			"Enter": "newlineAndIndentContinueMarkdownList"
		}
	});

	var doc = codeMirror.getDoc();

	// var onchangeCallback = [];
    //
	// editor.onchange = function(callback) {
	// 	onchangeCallback.push(callback);
	// }

    var callbackMap = {};

    editor.on = function (action, callback) {
        if (!callbackMap.hasOwnProperty(action)){
            callbackMap[action] = [];
        }
        callbackMap[action].push(callback);
    }
    

	codeMirror.on('change', function() {
        call('change', doc.getValue());
	});

    codeMirror.on('scroll', function () {
        var line = parseInt(codeMirror.lineAtHeight(codeMirror.getScrollInfo().top, 'local')) + 1;
        var offset = getLineHeight(line) - codeMirror.heightAtLine(line, 'local') + codeMirror.getScrollInfo().top;
        call('scroll', line, offset);
    });
    
    function call() {
        var args = Array.prototype.slice.call(arguments);
        var action = args[0];
        if (callbackMap.hasOwnProperty(action)){
            for (var i in callbackMap[action])
                callbackMap[action][i].apply(null, args.slice(1));
        }
    }

    function getLineHeight(line) {
        if (line == 1) {
            return codeMirror.heightAtLine(1, 'local');
        }
        return codeMirror.heightAtLine(line, 'local') - codeMirror.heightAtLine(line - 1, 'local');
    }

	this.editor = editor;

})();