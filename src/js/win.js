(function () {
    const bw = require('electron').remote.getCurrentWindow();
    var shell = require('electron').shell;
    var win = {};

    var oTitle = document.getElementById('titlebar-title');
    var oAboutDialog = document.getElementById('about-dialog');

    win.toogleFullScreen = function () {
        bw.setFullScreen(!bw.isFullScreen());
    };

    win.minimize = function () {
        bw.minimize();
    };

    win.toggleMaximize = function () {
        if (bw.isMaximized())
            bw.unmaximize();
        else
            bw.maximize();
    };

    win.preClose = function () {
        if (editor.isClean()) {
            closeNoSaving();
            return;
        }
        utils.showDialog({
            title: '保存文档',
            content: '当前文档已经修改，需要保存吗？',
            type: 1,
            positive: {
                text: '保存',
                callback: closeAfterSaving
            },
            negative: {
                text: '不保存',
                callback: closeNoSaving
            }
        });
    };

    win.setTitle = function (title) {
        oTitle.textContent = title;
    };

    window.onbeforeunload = function (e) {
        win.preClose();
        e.returnValue = false;
    };

    // 保存当前文档后再退出
    function closeAfterSaving() {
        editor.save(closeNoSaving);
    }

    // 直接退出
    function closeNoSaving() {
        workspace.cache(function () {
            bw.destroy();
        });
    }

    /**
     * 弹出关于Dialog
     */
    win.about = function () {
        utils.showDialog({}, oAboutDialog);
    };

    win.openUrl = function (href) {
        shell.openExternal(href);
        return false;
    };

    this.win = win;
})();