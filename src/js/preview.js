(function () {
    var oPreviewContainer = document.getElementById('preview-container');
    var oPreviewWrap = document.getElementById('preview-wrap');
    var oPreview = document.getElementById('preview');
    var oContentCheckbox = document.getElementById('content-checkbox');
    var oContentContainer = document.getElementById('content-container');
    var oContentWrap = document.getElementById('content-wrap');
    var oContentWords = document.getElementById('content-words');
    var oAlignRadioGroup = document.getElementById('align-radio-group');
    var mathjaxBuffer = document.getElementById('mathjax-buffer');
    var chartBuffer = document.getElementById('chart-buffer');
    var sequenceBuffer = document.getElementById('sequence-buffer');
    var renderer = new marked.Renderer();
    var shell = require('electron').shell;

    renderer.link = function (href, title, text) {
        return handleLink(href, title, text);
    };

    renderer.image = function (href, title, text) {
        return "<img src=" + href + " title='" + text + "' onclick='utils.zoom(this)'/><i style='margin:8px auto 0 auto; display:table'>" + text + "</i>";
    };

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
        langPrefix: 'language-',
        codePrefix: 'hljs',
        highlight: highlight,
        sourceLine: true
    };

    var preview = {
        isMathjax: true
    };

    marked.setOptions(markedConfig);

    var mathjaxHandler = {
        delay: 30, // delay after keystroke before updating
        output: null, // filled in by Init below
        buffer: mathjaxBuffer, // filled in by Init below
        timeout: null, // store setTimeout id
        mjRunning: false, // true when MathJax is processing
        mjPending: false, // true when a typeset has been queued
        inputText: null,
        start: function (inputText, callback) {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.inputText = inputText;
            this.callback = callback;
            this.timeout = setTimeout(this.handleCallback, this.delay);
        },
        handle: function () {
            this.timeout = null;
            if (this.mjPending) return;
            if (this.mjRunning) {
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
        done: function () {
            this.mjRunning = this.mjPending = false;
            var value = this.buffer.innerHTML;
            this.buffer.innerHTML = null;
            this.callback(value);
        }
    };
    mathjaxHandler.handleCallback = MathJax.Callback(["handle", mathjaxHandler]);
    mathjaxHandler.handleCallback.autoReset = true;

    // 预览文字对齐方式
    var aligNArray = ['left', 'center', 'right'];
    oAlignRadioGroup.onselect = function (i) {
        oPreview.style.textAlign = aligNArray[i];
    };

    // 处理链接

    function handleLink(href, title, text) {
        return '<a href="' + href + '" title="' + title + '" onclick="return preview.openExternal(href)">' + text + '</a>'
    }

    // 代码高亮
    function highlight(code, language) {
        if (language == 'auto') {
            return hljs.highlightAuto(code).value;
        }
        // 时序图
        if (language == 'sequence') {
            try {
                var previous = sequenceBuffer.innerHTML;
                sequenceBuffer.innerHTML = null;
                Diagram.parse(code).drawSVG('sequence-buffer', {
                    theme: 'simple'
                });
                var current = sequenceBuffer.innerHTML;
                if (previous)
                    sequenceBuffer.innerHTML = previous;
                return '<p class="text-center">' + current + '</p>';
            } catch (e) {
                console.error(e);
                return '<pre><code>' + code + '</code></pre>';
            }
        }
        // 流程图
        if (language == 'flow') {
            try {
                var previous = chartBuffer.innerHTML;
                chartBuffer.innerHTML = null;
                flowchart.parse(code).drawSVG('chart-buffer', flowchartConfig);
                var current = chartBuffer.innerHTML;
                if (previous)
                    chartBuffer.innerHTML = previous;
                return '<p class="text-center">' + current + '</p>';
            } catch (e) {
                return '<pre><code>' + code + '</code></pre>';
            }
        }
        try {
            return hljs.highlight(language, code).value;
        } catch (e) {
            return hljs.highlightAuto(code).value;
        }
    }

    // 设置预览内容
    var timer = null;
    editor.on('change', function (value) {
        // 延迟加载预览
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(function () {
            mathjaxHandler.start(marked(value), function (value) {
                oPreview.innerHTML = value;
            });
        }, 500);

    });

    // 监听editor滚动
    var lastAnim = null;
    editor.on('scroll', function (line, offset) {
        var target = oPreviewWrap.querySelector('[source-line="' + line + '"]');
        if (target) {
            var begin = oPreviewWrap.scrollTop;
            var end = target.offsetTop + offset - 80;
            lastAnim = utils.Animation.animate('linear', begin, end, 150, {
                start: function () {
                    utils.Animation.clear(lastAnim);
                },
                update: function (value) {
                    oPreviewWrap.scrollTop = value;
                }
            });
        }
    });

    window.onresize = setPreviewPadding;
    window.onload = setPreviewPadding;

    function setPreviewPadding() {
        var paddingBottom = parseInt(window.getComputedStyle(oPreviewWrap).height);
        oPreview.style.paddingBottom = (paddingBottom - 80) + 'px';
    }

    preview.openExternal = function (href) {
        shell.openExternal(href);
        return false;
    };

    /*preview最大/最小化*/
    preview.toggleMaximize = function () {
        if (preview.isMaximize) {
            preview.unmaximize();
        } else {
            preview.maximize();
        }
        preview.isMaximize = !preview.isMaximize;
    };

    preview.maximize = function () {
        utils.Animation.animate('expoEaseOut', 50, 100, 300, function (value) {
            oPreviewContainer.style.width = value + '%';
        });
    };

    preview.unmaximize = function () {
        utils.Animation.animate('expoEaseOut', 100, 50, 300, function (value) {
            oPreviewContainer.style.width = value + '%';
        });
    };

    utils.addHotKey('ctrl+ l', function () {
        preview.export2pdf();
    });

    /*显示/隐藏 目录*/

    oContentCheckbox.onchange = function (isChecked) {
        if (isChecked)
            preview.openContent();
        else
            preview.closeContent();
    };

    preview.openContent = function () {
        var width = 0;
        var height = 0;
        oContentWrap.innerHTML = buildContent(oPreview, false);
        oContentWords.innerText = '字数：' + oPreviewWrap.innerText.replace(/\s|\n/img, '').length;
        utils.Animation.animate('expoEaseOut', 0, 1, 300, {
            start: function () {
                oContentContainer.style.display = 'block';
                width = getComputedWidth(oContentContainer);
                height = getComputedHeight(oContentContainer);
            },
            update: function (value) {
                oContentContainer.style.width = utils.Animation.mapValueInRange(value, 0, 1, 0, width) + 'px';
                oContentContainer.style.height = utils.Animation.mapValueInRange(value, 0, 1, 0, height) + 'px';
            }
        });
    };

    preview.closeContent = function () {
        var width = 0;
        var height = 0;
        utils.Animation.animate('expoEaseOut', 0, 1, 200, {
            start: function () {
                var containerStyle = window.getComputedStyle(oContentContainer, null);
                width = parseInt(containerStyle.width);
                height = parseInt(containerStyle.height);
            },
            update: function (value) {
                oContentContainer.style.width = utils.Animation.mapValueInRange(value, 0, 1, width, 0) + 'px';
                oContentContainer.style.height = utils.Animation.mapValueInRange(value, 0, 1, height, 0) + 'px';
            },
            finish: function () {
                oContentContainer.style.display = 'none';
                oContentContainer.style.width = width + 'px';
                oContentContainer.style.height = height + 'px';
            }
        });
    };

    function buildContent(rootEle, isIndex) {
        var buff = "";
        var tagStack = [];
        var indexStack = isIndex ? [] : null;
        var titleEles = rootEle.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (var i = 0; i < titleEles.length; i++) {
            var tag = titleEles[i].tagName;
            while (true) {
                if (tagStack.length == 0 || tag > tagStack[tagStack.length - 1]) {
                    // 处理index
                    var index = '';
                    if (tag != "H1" && isIndex) {
                        indexStack.push(1);
                        for (var j = 0; j < indexStack.length; j++) {
                            index += indexStack[j] + '.'
                        }
                    }
                    // 处理tag
                    tagStack.push(tag);
                    buff += '<ul><li><a href="#' + titleEles[i].getAttribute('source-line') + '">' + index + '' + titleEles[i].innerText + '</a>';
                    break;
                }
                if (tag == tagStack[tagStack.length - 1]) {
                    // 处理index
                    index = '';
                    if (isIndex) {
                        indexStack[indexStack.length - 1]++;
                        for (var k = 0; k < indexStack.length; k++) {
                            index += indexStack[k] + '.';
                        }
                    }
                    // 处理tag
                    tagStack.pop();
                    tagStack.push(tag);
                    buff += '</li><li><a href="#' + titleEles[i].getAttribute('source-line') + '">' + index + ' ' + titleEles[i].innerText + '</a>'
                    break;
                }
                if (isIndex) {
                    indexStack.pop();
                }
                tagStack.pop();

                buff += '</li></ul>'
            }
        }
        while (tagStack.length != 0) {
            tagStack.pop();
            buff += '</li></ul>';
        }
        return buff;
    }

    function getComputedWidth(ele) {
        return parseInt(window.getComputedStyle(ele, null).width);
    }

    function getComputedHeight(ele) {
        return parseInt(window.getComputedStyle(ele, null).height);
    }

    /*以pdf带出*/
    preview.export2pdf = function () {
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
        //		win.bw.webContents.printToPDF({
        //			pageSize: 'A4',
        //			printBackground: true,
        //			printSelectionOnly: true
        //		}, function(error, data) {
        //			if(error) throw err
        //			fs.writeFile('C:/Users/dongkuo/Desktop/test.pdf', data, 'utf8', function(err) {
        //				if(err) throw err
        //			});
        //		});
        // var doc = new jsPDF();

        // We'll make our own renderer to skip this editor
        //		var specialElementHandlers = {
        //			'#editor': function(element, renderer) {
        //				return true;
        //			}
        //		};

        // All units are in the set measurement for the document
        // This can be changed to "pt" (points), "mm" (Default), "cm", "in"
        // doc.fromHTML(oPreview, 15, 15, {
        //     'width': 170,
        //     'elementHandlers': specialElementHandlers
        // });
    };

    this.preview = preview;

})();