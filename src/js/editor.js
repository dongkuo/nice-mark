(function() {

	var editor = {};

	var renderer = new marked.Renderer();

	marked.setOptions({
		renderer: renderer,
		gfm: true,
		tables: true,
		breaks: true,
		pedantic: false,
		sanitize: false,
		smartLists: true,
		smartypants: false,
		sourceLine: true,
		gfm: true,
		langPrefix: 'language-',
		highlight: function(code, language) {
			if (language == 'auto') {
				return hljs.highlightAuto(code).value;
			}
			try {
				return hljs.highlight(language, code).value;
			} catch (e) {
				return hljs.highlightAuto(code).value;
			}
		}
	});

	var codeMirror = CodeMirror(document.getElementById('editor'), {
		mode: 'gfm',
		lineNumbers: true,
		lineWrapping: true,
		theme: "nicemark",
		autofocus: true,
		foldGutter: true,
		scrollPastEnd: true,
		gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
		extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
	});

	var doc = codeMirror.getDoc();

	var onchangeCallback = [];

	editor.onchange = function(callback) {
		onchangeCallback.push(callback);
	}

	codeMirror.on("change", function() {
		for (var i in onchangeCallback) {
			onchangeCallback[i](doc.getValue());
		}
	});

	this.editor = editor;

})();