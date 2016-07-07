(function () {

    var oEditor = document.getElementById('editor');

    var editor = {};

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

    editor.on = function (action, callback) {
        if (!callbackMap.hasOwnProperty(action)) {
            callbackMap[action] = [];
        }
        callbackMap[action].push(callback);
    };

    // 设置内容

    editor.setContent = function (content) {
        codeMirror.setValue(content);
    };


    // 监听拽入
    oEditor.ondragover = oEditor.ondragleave = oEditor.ondragend = function () {
        return false;
    };

    oEditor.ondrop = function (e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        var imageType = /text\/markdown/;
        if (!file.type.match(imageType)) {
            alert('请拖入markdown文件...');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            // console.log(e.target.result);
            editor.setContent(e.target.result);
        };
        reader.readAsText(file, 'utf-8');
        return false;
    };

    // 监听内容
    codeMirror.on('change', function () {
        call('change', doc.getValue());
    });

    // 监听滚动
    codeMirror.on('scroll', function () {
        var line = parseInt(codeMirror.lineAtHeight(codeMirror.getScrollInfo().top, 'local')) + 1;
        var offset = getLineHeight(line) - codeMirror.heightAtLine(line, 'local') + codeMirror.getScrollInfo().top;
        call('scroll', line, offset);
    });

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