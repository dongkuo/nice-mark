(function() {
	const bw = require('electron').remote.getCurrentWindow();
	var win = new Object();

	var oTitle = document.getElementById('titlebar-title');

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
		workspace.cache();
	}

	win.setTitle = function(title) {
		oTitle.textContent = title;
	}

	bw.on('close', function() {
		workspace.cache();
		bw = null;
	})

	this.win = win;
})()