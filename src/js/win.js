(function() {
	const BrowserWindow = require('electron').remote.BrowserWindow;
	const bw = BrowserWindow.getFocusedWindow();
	var win = {
		BrowserWindow: BrowserWindow,
		bw: bw
	};

	var oTitle = document.getElementById('titlebar-title');
	//	var oFullscreen = document.getElementById('btn-fullscreen');
	//	var oMinimize = document.getElementById('btn-minimize');
	//	var oMaximize = document.getElementById('btn-maximize');
	//	var oClose = document.getElementById('btn-close');

	win.toogleFullScreen = function() {
		bw.setFullScreen(!bw.isFullScreen());
	};

	win.minimize = function() {
		bw.minimize();
	};

	win.toggleMaximize = function() {
		if(bw.isMaximized())
			bw.unmaximize()
		else
			bw.maximize()
	};

	win.close = function() {
		bw.close();
	}

	win.setTitle = function(title) {
		oTitle.textContent = title;
	}

	this.win = win;
})()