(function() {
	var oPreviewContainer = document.getElementById('preview-container');
	var oPreviewWrap = document.getElementById('preview-wrap');
	var oPreview = document.getElementById('preview');
	var mathjaxBuffer = document.getElementById('mathjax-buffer');
	var chartBuffer = document.getElementById('chart-buffer');
	var sequenceBuffer = document.getElementById('sequence-buffer');
	var renderer = new marked.Renderer();

	var flowchartConfig = {
		'font-family': '"Lato", "proxima-nova", "Helvetica Neue", Arial, "microsoft yahei"',
		'line-width': 2,
		'font-size': 16,
		'fill': 'transparent',
		'yes-text': '是',
		'no-text': '否'
	};

	var markedConfig = {
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
		highlight: highlight,
		sourceLine: true
	}

	var preview = {
		isMathjax: true
	}

	marked.setOptions(markedConfig);

	var mathjaxHandler = {
		delay: 30, // delay after keystroke before updating
		output: null, // filled in by Init below
		buffer: mathjaxBuffer, // filled in by Init below
		timeout: null, // store setTimeout id
		mjRunning: false, // true when MathJax is processing
		mjPending: false, // true when a typeset has been queued
		inputText: null,
		start: function(inputText, callback) {
			if(this.timeout) {
				clearTimeout(this.timeout);
			}
			this.inputText = inputText;
			this.callback = callback;
			this.timeout = setTimeout(this.handleCallback, this.delay);
		},
		handle: function() {
			this.timeout = null;
			if(this.mjPending) return;
			if(this.mjRunning) {
				this.mjPending = true;
				MathJax.Hub.Queue(["handle", this]);
			} else {
				this.buffer.innerHTML = this.inputText;
				this.mjRunning = true;
				MathJax.Hub.Queue(
					["Typeset", MathJax.Hub, this.buffer], ["done", this]
				);
			}
		},
		done: function() {
			this.mjRunning = this.mjPending = false;
			var value = this.buffer.innerHTML;
			this.buffer.innerHTML = null;
			this.callback(value);
		}
	};
	mathjaxHandler.handleCallback = MathJax.Callback(["handle", mathjaxHandler]);
	mathjaxHandler.handleCallback.autoReset = true;

	// 代码高亮
	function highlight(code, language) {
		if(language == 'auto') {
			return hljs.highlightAuto(code).value;
		}
		// 时序图
		if(language == 'sequence') {
			try {
				var previous = sequenceBuffer.innerHTML;
				sequenceBuffer.innerHTML = null;
				Diagram.parse(code).drawSVG('sequence-buffer', {
					theme: 'simple'
				});
				var current = sequenceBuffer.innerHTML;
				if(previous)
					sequenceBuffer.innerHTML = previous;
				return '<p class="text-center">' + current + '</p>';
			} catch(e) {
				console.error(e);
				return '<pre><code>' + code + '</code></pre>';
			}
		}
		// 流程图
		if(language == 'flow') {
			try {
				var previous = chartBuffer.innerHTML;
				chartBuffer.innerHTML = null;
				flowchart.parse(code).drawSVG('chart-buffer', flowchartConfig);
				var current = chartBuffer.innerHTML;
				if(previous)
					chartBuffer.innerHTML = previous;
				return '<p class="text-center">' + current + '</p>';
			} catch(e) {
				return '<pre><code>' + code + '</code></pre>';
			}
			return '';
		}
		try {
			return hljs.highlight(language, code).value;
		} catch(e) {
			return hljs.highlightAuto(code).value;
		}
	}

	// 设置预览内容
	var timer = null;
	editor.on('change', function(value) {
		// 延迟加载预览
		if(timer) window.clearTimeout(timer);
		timer = window.setTimeout(function() {
			if(preview.isMathjax)
				mathjaxHandler.start(marked(value), function(value) {
					oPreview.innerHTML = value;
				});
			else
				oPreview.innerHTML = marked(value);
		}, 300);

	});

	// 监听editor滚动
	var lastAnim = null;
	editor.on('scroll', function(line, offset) {
		var target = oPreviewWrap.querySelector('[source-line="' + line + '"]');
		if(target) {
			var begin = oPreviewWrap.scrollTop;
			var end = target.offsetTop + offset - 80;
			var anim = utils.Animation.animate('linear', begin, end, 150, {
				start: function() {
					utils.Animation.clear(lastAnim);
				},
				update: function(value) {
					oPreviewWrap.scrollTop = value;
				}
			});
			lastAnim = anim;
		}
	});

	window.onresize = setPreviewPadding;
	window.onload = setPreviewPadding;

	function setPreviewPadding() {
		var paddingBottom = parseInt(window.getComputedStyle(oPreviewWrap).height);
		oPreview.style.paddingBottom = (paddingBottom - 80) + 'px';
	}

	/*preview最大/最小化*/
	preview.toggleMaximize = function() {
		if(preview.isMaximize) {
			preview.unmaximize();
		} else {
			preview.maximize();
		}
		preview.isMaximize = !preview.isMaximize;
	}

	preview.maximize = function() {
		utils.Animation.animate('expoEaseOut', 50, 100, 300, {
			'start': function() {
				oPreviewContainer.style['z-index'] = 20;
			},
			'update': function(value) {
				oPreviewContainer.style.width = value + '%';
			}
		});
	}

	preview.unmaximize = function() {
		utils.Animation.animate('expoEaseOut', 100, 50, 300, {
			'update': function(value) {
				oPreviewContainer.style.width = value + '%';
			},
			'finish': function() {
				oPreviewContainer.style['z-index'] = 0;
			}
		});
	}
	
	utils.addHotKey('ctrl+ l', function(){
		preview.export2pdf();
	});

	/*以pdf带出*/
	preview.export2pdf = function() {
		//		console.log('测试');
		//		var iframe = document.getElementById('print-iframe');
		//		iframe.contentWindow.document.querySelector('#preview-wrap').innerHTML = marked(editor.getValue());
		//		iframe.contentWindow.printPdf();
		//		var child = new win.BrowserWindow({
		//			parent: win.bw,
		//			width: 300,
		//			height: 300,
		//			modal: true
		//		});
		win.bw.webContents.printToPDF({
			pageSize: 'A4',
			printBackground: true,
			printSelectionOnly: true
		}, function(error, data) {
			if(error) throw err
			utils.fs.writeFile('C:/Users/dongkuo/Desktop/test.pdf', data, 'utf8', function(err) {
				if(err) throw err
			});
		});
	}

	this.preview = preview;

})();