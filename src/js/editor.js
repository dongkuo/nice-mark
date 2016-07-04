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

	var onchangeCallback = [];

	editor.onchange = function(callback) {
		onchangeCallback.push(callback);
	}

	codeMirror.on("change", function() {
		for (var i in onchangeCallback)
			onchangeCallback[i](doc.getValue());
	});

	this.editor = editor;

})();