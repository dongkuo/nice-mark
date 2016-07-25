(function() {

	var oEditorContainer = document.getElementById('editor-container');
	var oEditor = document.getElementById('editor');
	const dialog = require('electron').remote.dialog;

	var editor = {};
	var path = null;

	var codeMirror = CodeMirror(oEditor, {
		mode: 'gfm',
		lineNumbers: true,
		lineWrapping: true,
		theme: "nicemark",
		autofocus: true,
		foldGutter: true,
		scrollPastEnd: true,
		dragDrop: false,
		gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
		extraKeys: {
			"Enter": "newlineAndIndentContinueMarkdownList"
		}
	});

	var doc = codeMirror.getDoc();

	var callbackMap = {};

	editor.on = function(action, callback) {
		if(!callbackMap.hasOwnProperty(action)) {
			callbackMap[action] = [];
		}
		callbackMap[action].push(callback);
	};

	/*获取内容*/
	editor.getValue = function() {
		return doc.getValue();
	}

	/*设置内容*/
	editor.setContent = function(content) {
		codeMirror.setValue(content);
	};

	editor.toggleMaximize = function() {
		if(editor.isMaximize) {
			editor.unmaximize();
		} else {
			editor.maximize();
		}
		editor.isMaximize = !editor.isMaximize;
	}

	editor.maximize = function() {
		utils.Animation.animate('expoEaseOut', 50, 100, 300, {
			'start': function() {
				oEditorContainer.style['z-index'] = 20;
			},
			'update': function(value) {
				oEditorContainer.style.width = value + '%';
			}
		});
	}

	editor.unmaximize = function() {
		utils.Animation.animate('expoEaseOut', 100, 50, 300, {
			'update': function(value) {
				oEditorContainer.style.width = value + '%';
			},
			'finish': function() {
				oEditorContainer.style['z-index'] = 0;
			}
		});
	}

	/*编辑相关*/
	editor.bold = function() {
		appendSymmetricInlineChar("**");
	}

	editor.italic = function() {
		appendSymmetricInlineChar("*");
	}

	editor.quotation = function() {
		appendBlockChar('>', 0, 3);
	}

	editor.ol = function() {
		appendBlockChar('1.', 0, 3);
	}

	editor.ul = function() {
		appendBlockChar('*', 0, 3);
	}

	editor.code = function() {
		var pos = newlineIfNeed();
		doc.replaceRange("```Java\n\n```", pos);
		doc.setCursor({
			'line': pos.line + 1,
			'ch': 0
		});
		codeMirror.focus();
	}

	editor.hr = function() {
		appendBlockChar('---\n\n', 2);
	}

	editor.math = function() {
		var pos = newlineIfNeed();
		doc.replaceRange("$$\n\n$$", pos);
		doc.setCursor({
			'line': pos.line + 1,
			'ch': 0
		});
		codeMirror.focus();
	}

	editor.link = function() {
		appendInlineChar('[]()', 1);
	}

	editor.image = function(title, path) {
		appendBlockChar('![' + (title || '') + '](' + (path || '') + ')', 0, title ? undefined : 2);
	}

	editor.table = function() {
		var pos = newlineIfNeed();
		appendBlockChar('|  列1    |  列2    |  列3    |\n|--------- |--------- |---------|\n|   行1   |  行1    |  行1    |', 2);
	}

	// 添加对称的行内符号
	function appendSymmetricInlineChar(symbol) {
		if(doc.somethingSelected()) {
			var offset = 0;
			var selectionPosList = doc.listSelections();
			for(var i in selectionPosList) {
				var pos = selectionPosList[i];
				var startCh, endCh;
				if(pos.anchor.ch < pos.head.ch) {
					startCh = pos.anchor.ch;
					endCh = pos.head.ch;
				} else {
					startCh = pos.head.ch;
					endCh = pos.anchor.ch;
				}
				doc.replaceRange(symbol, {
					'line': pos.anchor.line,
					'ch': startCh + offset
				});
				offset += symbol.length;
				doc.replaceRange(symbol, {
					'line': pos.anchor.line,
					'ch': endCh + offset
				});
				offset += symbol.length;
			}
		} else {
			doc.replaceRange(symbol + symbol, doc.getCursor());
			doc.setCursor({
				'line': doc.getCursor().line,
				'ch': doc.getCursor().ch - symbol.length
			});
		}
		codeMirror.focus();
	}

	// 添加非对称行内符号
	function appendInlineChar(symbol, chOffset) {
		var pos = doc.getCursor();
		doc.replaceRange(symbol, pos);
		doc.setCursor({
			'line': pos.line,
			'ch': pos.ch + chOffset
		});
		codeMirror.focus();
	}

	// 添加行间符号
	function appendBlockChar(symbol, lineOffset, ch) {
		var pos = newlineIfNeed();
		doc.replaceRange(symbol + ' ', pos);
		doc.setCursor({
			'line': lineOffset ? (pos.line + lineOffset) : pos.line,
			'ch': typeof(ch) == 'undefined' ? doc.getCursor().ch : ch
		});
		codeMirror.focus();
	}

	function newlineIfNeed() {
		var pos = doc.getCursor();
		var line = pos.line;
		var ch = pos.ch;
		if(ch != 0 && doc.getLine(line).trim() != '') {
			line += 2;
		}
		if(doc.lastLine() < line) {
			doc.replaceRange('\n\n', {
				'line': line,
				'ch': ch
			});
		}
		return {
			line: line,
			ch: 0
		};
	}

	/*监听拽入*/
	oEditor.ondragover = oEditor.ondragleave = oEditor.ondragend = function() {
		return false;
	};

	oEditor.ondrop = function(e) {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if(file.type.match(/image.*/)) {
			try {
				var title = file.name.match('(.+)\\..+$')[1];
			} catch(e) {
				//ignore
			}
			editor.image(title, file.path);
			return;
		} else if(!file.name.match(/\.(markdown|md)$/)) {
			alert('请拖入markdown文件...');
			return;
		}
		var reader = new FileReader();
		reader.onload = function(e) {
			editor.setContent(e.target.result);
			path = file.path || file.name;
			win.setTitle(file.path);
		};
		reader.readAsText(file, 'utf-8');
		return false;
	};

	/*监听内容*/
	codeMirror.on('change', function() {
		call('change', doc.getValue());
		win.setTitle((path || '未命名') + (doc.isClean() ? '' : ' *'));
	});

	/*监听滚动*/
	codeMirror.on('scroll', function() {
		var line = parseInt(codeMirror.lineAtHeight(codeMirror.getScrollInfo().top, 'local')) + 1;
		var offset = getLineHeight(line) - codeMirror.heightAtLine(line, 'local') + codeMirror.getScrollInfo().top;
		call('scroll', line, offset);
	});

	/*保存快捷键*/
	utils.addHotKey('ctrl + s', function() {
		if(doc.isClean()) {
			return;
		}
		if(!path) {
			dialog.showSaveDialog({
				title: '保存文档',
				properties: ['openFile'],
				defaultPath: 'nicemark.md'
			}, function(filename) {
				if(filename) {
					path = filename;
					save2file(filename);
				}
			});
			return;
		}
		save2file(path);
	});

	function save2file(savePath) {
		utils.fs.writeFile(savePath, doc.getValue(), 'utf8', function(err) {
			if(err) throw err
			if(savePath == path) {
				win.setTitle(path);
				doc.markClean();
			}
		});
	}

	function call() {
		var args = Array.prototype.slice.call(arguments);
		var action = args[0];
		if(callbackMap.hasOwnProperty(action)) {
			for(var i in callbackMap[action])
				callbackMap[action][i].apply(null, args.slice(1));
		}
	}

	function getLineHeight(line) {
		if(line == 1) {
			return codeMirror.heightAtLine(1, 'local');
		}
		return codeMirror.heightAtLine(line, 'local') - codeMirror.heightAtLine(line - 1, 'local');
	}

	this.editor = editor;

})();