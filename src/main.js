const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
let win;

function createWindow() {
	// Create the browser window.
	win = new BrowserWindow({
		width: 1200,
		height: 800,
		frame: false,
		defaultFontSize: 16,
		minWidth: 1200, 
		minHeight: 800,
		defaultMonospaceFontSize: 16,
		defaultEncoding: "utf-8"
	});

	// and load the index.html of the app.
	win.loadURL(`file://${__dirname}/index.html`);

	win.webContents.openDevTools();

	win.on('closed', () => {
		win = null;
	});
}

app.on('ready', createWindow);