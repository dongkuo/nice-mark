(function () {

    const fs = require('fs');
    const Menu = require('electron').remote.Menu;
    const bw = require('electron').remote.getCurrentWindow();

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
            "Enter": "newlineAndIndentContinueMarkdownList",
            "Ctrl-Q": function (cm) {
                cm.foldCode(cm.getCursor());
            }
        }
    });

    var doc = codeMirror.getDoc();

    var callbackMap = {};

    editor.on = function (action, callback) {
        if (!callbackMap.hasOwnProperty(action)) {
            callbackMap[action] = [];
        }
        callbackMap[action].push(callback);
    };

    /*获取内容*/
    editor.getValue = function () {
        return doc.getValue();
    };

    editor.readFile = function (filePath) {
        fs.readFile(filePath, 'utf8', function (err, data) {
            if (err) {
                utils.showToast(err, 2);
                return;
            }
            editor.setContent(data);
            path = filePath;
            win.setTitle(filePath);
        });

    };

    /*设置内容*/
    editor.setContent = function (content) {
        codeMirror.setValue(content);
        doc.markClean();
    };

    editor.isClean = function () {
        return doc.isClean();
    };

    editor.toggleMaximize = function () {
        if (editor.isMaximize) {
            editor.unmaximize();
        } else {
            editor.maximize();
        }
        editor.isMaximize = !editor.isMaximize;
    };

    editor.maximize = function () {
        utils.Animation.animate('expoEaseOut', 50, 100, 300, {
            'start': function () {
                oEditorContainer.style['z-index'] = 20;
            },
            'update': function (value) {
                oEditorContainer.style.width = value + '%';
            }
        });
    };

    editor.unmaximize = function () {
        utils.Animation.animate('expoEaseOut', 100, 50, 300, {
            'update': function (value) {
                oEditorContainer.style.width = value + '%';
            },
            'finish': function () {
                oEditorContainer.style['z-index'] = 0;
            }
        });
    };

    /*编辑相关*/
    editor.bold = function () {
        appendSymmetricInlineChar("**");
    };

    editor.italic = function () {
        appendSymmetricInlineChar("*");
    };

    editor.quotation = function () {
        appendBlockChar('>', 0, 3);
    };

    editor.ol = function () {
        appendBlockChar('1.', 0, 3);
    };

    editor.ul = function () {
        appendBlockChar('*', 0, 3);
    };

    editor.code = function () {
        var pos = newlineIfNeed();
        doc.replaceRange("```Java\n\n```", pos);
        doc.setCursor({
            'line': pos.line + 1,
            'ch': 0
        });
        codeMirror.focus();
    };

    editor.code_inline = function () {
        appendSymmetricInlineChar("`");
    };

    editor.hr = function () {
        appendBlockChar('---\n\n', 2);
    };

    editor.math = function () {
        var pos = newlineIfNeed();
        doc.replaceRange("$$\n\n$$", pos);
        doc.setCursor({
            'line': pos.line + 1,
            'ch': 0
        });
        codeMirror.focus();
    };

    editor.math_inline = function () {
        appendSymmetricInlineChar("$");
    };

    editor.link = function () {
        appendInlineChar('[]()', 1);
    };

    editor.image = function (title, path) {
        appendBlockChar('![' + (title || '') + '](' + (path || '') + ')', 0, title ? undefined : 2);
    };

    editor.table = function () {
        var pos = newlineIfNeed();
        appendBlockChar('|    列1    |    列2    |    列3    |\n|--------- |--------- |--------- |\n|    行1    |    行1    |    行1    |', 2);
    };

    editor.save = function (callback) {
        if (!path) {
            dialog.showSaveDialog({
                title: '保存文档',
                properties: ['openFile'],
                defaultPath: 'nicemark.md'
            }, function (filename) {
                if (filename) {
                    path = filename;
                    save2file(filename, callback);
                }
            });
            return;
        }
        save2file(path, callback);
    };

    // 添加快捷键
    // 行间
    utils.addHotKey("ctrl + h", editor.hr);
    utils.addHotKey("ctrl + u", editor.ul);
    utils.addHotKey("ctrl + o", editor.ol);
    utils.addHotKey("ctrl + t", editor.table);
    utils.addHotKey("ctrl + q", editor.quotation);
    utils.addHotKey("ctrl + m", editor.math);
    utils.addHotKey("ctrl + g", editor.image);
    utils.addHotKey("alt  + c", editor.code);
    // 行内
    utils.addHotKey("ctrl + shift + b", editor.bold);
    utils.addHotKey("ctrl + shift + i", editor.italic);
    utils.addHotKey("ctrl + shift + l", editor.link);
    utils.addHotKey("ctrl + shift + m", editor.math_inline);
    utils.addHotKey("ctrl + shift + c", editor.code_inline);

    // 添加对称的行内符号
    function appendSymmetricInlineChar(symbol) {
        if (doc.somethingSelected()) {
            var offset = 0;
            var selectionPosList = doc.listSelections();
            for (var i in selectionPosList) {
                var pos = selectionPosList[i];
                var startCh, endCh;
                if (pos.anchor.ch < pos.head.ch) {
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
        if (ch != 0 && doc.getLine(line).trim() != '') {
            line += 2;
        }
        if (doc.lastLine() < line) {
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
    oEditor.ondragover = oEditor.ondragleave = oEditor.ondragend = function () {
        return false;
    };

    oEditor.ondrop = function (e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file.type.match(/image.*/)) {
            try {
                var title = file.name.match('(.+)\\..+$')[1];
            } catch (e) {
                //ignore
            }
            editor.image(title, file.path);
            return;
        } else if (!file.name.match(/\.(markdown|md)$/)) {
            alert('请拖入markdown文件...');
            return;
        }
        editor.readFile(file.path);
        return false;
    };

    /*监听内容*/
    codeMirror.on('change', function () {
        call('change', doc.getValue());
        win.setTitle((path || '未命名') + (doc.isClean() ? '' : ' *'));
    });

    /*监听滚动*/
    codeMirror.on('scroll', function () {
        var line = parseInt(codeMirror.lineAtHeight(codeMirror.getScrollInfo().top, 'local')) + 1;
        var offset = getLineHeight(line) - codeMirror.heightAtLine(line, 'local') + codeMirror.getScrollInfo().top;
        call('scroll', line, offset);
    });

    /*保存快捷键*/
    utils.addHotKey('ctrl + s', function () {
        if (doc.isClean()) {
            return;
        }
        editor.save();
    });

    utils.addHotKey('ctrl + p', function () {
        utils.showDialog({
            title: '未保存',
            content: '当前文档暂未保存，确定打开新文档？',
            positive: function () {
                dismissDialog(messageDialog);
                read();
            },
            type: 1
        });
    });

    /*添加右键菜单*/
    const template = [{
        role: 'undo'
    }, {
        role: 'redo'
    }, {
        type: 'separator'
    }, {
        role: 'cut'
    }, {
        role: 'copy'
    }, {
        role: 'paste'
    }, {
        role: 'pasteandmatchstyle'
    }, {
        role: 'delete'
    }, {
        role: 'selectall'
    }];

    const menu = Menu.buildFromTemplate(template);
    oEditor.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        e.stopPropagation();
        menu.popup(bw);
    }, false);

    function save2file(savePath, callback) {
        fs.writeFile(savePath, doc.getValue(), 'utf8', function (err) {
            if (err) {
                utils.showToast(err, 2);
                return;
            }
            if (savePath == path) {
                win.setTitle(path);
                doc.markClean();
            }
            utils.showToast("保存成功!");
            if (callback instanceof Function) callback();
        });
    }

    function call() {
        var args = Array.prototype.slice.call(arguments);
        var action = args[0];
        if (callbackMap.hasOwnProperty(action)) {
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