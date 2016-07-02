(function() {
	var codeMirror = CodeMirror(document.getElementById('editor'), {
		mode: 'gfm',
		lineNumbers: true,
		lineWrapping: true,
		theme: "nicemark",
		autofocus: true,
		extraKeys: {
			"Enter": "newlineAndIndentContinueMarkdownList"
		}
	});

})();