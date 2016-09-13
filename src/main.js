const electron = require('electron');
const path = require('path');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

function openWindow() {

    let pluginName;
    switch (process.platform) {
        case 'win32':
            pluginName = 'pepflashplayer.dll';
            break;
        case 'darwin':
            pluginName = 'PepperFlashPlayer.plugin';
            break;
        case 'linux':
            pluginName = 'libpepflashplayer.so';
            break;
    }
    app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname, pluginName));

    // Create the browser window.
    var win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        defaultFontSize: 16,
        minWidth: 1200,
        minHeight: 800,
        icon: path.join(__dirname, 'img/icon.png'),
        defaultMonospaceFontSize: 16,
        defaultEncoding: "utf-8",
        webPreferences: {
            plugins: true
        }
    });

    win.loadURL(`file://${__dirname}/index.html`);

    win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', openWindow);
app.on('window-all-closed', () => {
    app.quit()
});