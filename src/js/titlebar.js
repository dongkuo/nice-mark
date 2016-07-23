(function() {
	const win = require('electron').remote.BrowserWindow.getFocusedWindow();
	var titlebar = {};

	var oTitle = document.getElementById('titlebar-title');
	var oFullscreen = document.getElementById('btn-fullscreen');
	var oMinimize = document.getElementById('btn-minimize');
	var oMaximize = document.getElementById('btn-maximize');
	var oClose = document.getElementById('btn-close');

	oFullscreen.onclick = function() {
		win.setFullScreen(!win.isFullScreen());
	};
	
	oMinimize.onclick = function(){
		win.minimize();
	};
	
	oMaximize.onclick = function(){
		if(win.isMaximized())
			win.unmaximize()
		else
			win.maximize()
	};

	oClose.onclick = function() {
		win.close();
	}

	titlebar.setTitle = function(title) {
		oTitle.textContent = title;
	}

	this.titlebar = titlebar;
})()