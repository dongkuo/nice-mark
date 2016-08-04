(function() {
	const app = require('electron').remote.app;
	const bw = require('electron').remote.getCurrentWindow();
	const Menu = require('electron').remote.Menu;
	const MenuItem = require('electron').remote.MenuItem;
	const path = require('path');
	const fs = require('fs');
	const workPath = path.join(app.getPath("appData"), 'NiceMark');
	const cachePath = path.join(workPath, "workspace.json");

	var tree = new Tree();
	var oWorkspaceSearchInput = document.getElementById("workspace-search-input");
	var oWorkspaceSearchBox = document.getElementById("workspace-search-box");
	var oMain = document.getElementById("main");
	var oWorkspaceTree = document.getElementById("workspace-tree");

	var workspace = new Object();

	fs.access(workPath, fs.F_OK, function(err) {
		if(err) {
			fs.mkdir(workPath, function(err) {});
		}
	});

	fs.readFile(cachePath, 'utf8', function(err, data) {
		if(!err)
			tree.appendNode(JSON.parse(data), null, true);
	});

	tree.into(oWorkspaceTree);

	oWorkspaceSearchInput.onfocus = function() {
		utils.Animation.animate('expoEaseOut', 0, 250, 300, {
			'start': function() {
				oWorkspaceSearchBox.style.height = 0;
				oWorkspaceSearchBox.style.display = 'block';
			},
			'update': function(value) {
				oWorkspaceSearchBox.style.height = value + 'px';
			}
		});
	}
	oWorkspaceSearchInput.onblur = function() {
		utils.Animation.animate('expoEaseOut', 250, 0, 300, {
			'finish': function() {
				oWorkspaceSearchBox.style.display = 'none';
			},
			'update': function(value) {
				oWorkspaceSearchBox.style.height = value + 'px';
			}
		});
	}
	workspace.toggle = function() {
		if(workspace.isOpen) {
			workspace.close();
		} else {
			workspace.open();
		}
	}

	workspace.open = function() {
		workspace.isOpen = true;
		utils.Animation.animate('expoEaseOut', parseInt(oMain.style.left) || -25, 0, 300, {
			'start': function() {
				var oCover = utils.showCover();
				oCover.one('click', function() {
					workspace.close();
				});
			},
			'update': function(value) {
				oMain.style.left = value + '%';
			}
		});
	}

	workspace.close = function() {
		workspace.isOpen = false;
		utils.Animation.animate('expoEaseOut', parseInt(oMain.style.left || -25), -25, 300, {
			'start': function() {
				utils.dismissCover();
			},
			'update': function(value) {
				oMain.style.left = value + '%';
			}
		});
	}

	workspace.cache = function() {
		fs.writeFile(cachePath, JSON.stringify(tree.top), {
			'encoding': 'utf8',
			'flag': 'w+'
		}, function(err) {
			if(err) console.log(err);
		});
	}

	/*右键菜单*/
	const workspaceMenu = new Menu()
	workspaceMenu.append(new MenuItem({
		label: '添加本地目录'
	}))

	oWorkspaceTree.addEventListener('contextmenu', function(e) {
		e.preventDefault()
		workspaceMenu.popup(bw);
	}, false)

	this.workspace = workspace;
})();