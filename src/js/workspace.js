(function() {
	const app = require('electron').remote.app;
	const bw = require('electron').remote.getCurrentWindow();
	const dialog = require('electron').remote.dialog;
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
	var oAddLocalFolderDialog = document.getElementById("add-local-folder-dialog");
	var oLocalFolderInput = document.getElementById("local-folder-input");
	var oLocalNameInput = document.getElementById("local-name-input");
	var oLocalTip = document.getElementById("local-tip");

	var workspace = new Object();

	fs.access(workPath, fs.F_OK, function(err) {
		if(err) {
			fs.mkdir(workPath, function(err) {});
		}
	});

	fs.readFile(cachePath, 'utf8', function(err, data) {
		if(!err && data)
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

	workspace.cache = function(callback) {
		fs.writeFile(cachePath, JSON.stringify(tree.top), {
			'encoding': 'utf8',
			'flag': 'w+'
		}, function(err) {
			if(err) {
				utils.toast(err, 2, callback);
				return;
			}
			if(callback instanceof Function) {
				callback();
			}
		});
	}

	workspace.initLocalFolderDialog = function() {
		oLocalFolderInput.value = oLocalNameInput.value = null;
		oLocalTip.textContent = '工作空间中显示的名称';
		oLocalTip.replaceAllClass('color-tip');
	}

	workspace.showAddLocalFolderDialog = function() {
		workspace.initLocalFolderDialog();
		utils.showDialog({
			positive: function() {
				var path = workspace.checkLocalFolder();
				if(!path) return;
				var name = workspace.checkLocalName();
				if(!name) return;
				workspace.addLocalFolder(path, name);
			}
		}, oAddLocalFolderDialog);
	}

	workspace.chooseLocalFolder = function() {
		dialog.showOpenDialog({
			properties: ['openDirectory']
		}, function(paths) {
			if(!paths) return;
			oLocalTip.textContent = '工作空间中显示的名称';
			oLocalTip.replaceAllClass('color-tip');
			oLocalFolderInput.value = paths[0];
			oLocalNameInput.value = paths[0].substring(paths[0].lastIndexOf(path.sep) + 1);
		});
	}

	workspace.checkLocalFolder = function() {
		if(!oLocalFolderInput.value) {
			oLocalTip.textContent = '请选择目录';
			oLocalTip.replaceAllClass('color-warning');
			return;
		}
		return oLocalFolderInput.value;
	}

	workspace.checkLocalName = function() {
		if(!oLocalNameInput.value) {
			oLocalTip.textContent = '请输入显示名称';
			oLocalTip.replaceAllClass('color-warning');
			return;
		}
		oLocalTip.textContent = '工作空间中显示的名称';
		oLocalTip.replaceAllClass('color-tip');
		return oLocalNameInput.value;
	}

	workspace.addLocalFolder = function(path, name) {
		tree.appendNode({
			name: name,
			path: path,
			children: []
		});
		utils.dismissDialog(oAddLocalFolderDialog);
		workspace.cache();
	}

	/*树的一些操作*/
	tree.on('toggle', function(node) {
		if(!node.toggle) return;
		listNode(node);
	});

	tree.on('dbclick', function(node) {
		if(editor.isClean()) {
			editor.readFile(node.path);
			workspace.toggle();
			return;
		}
		utils.showDialog({
			title: '保存文档',
			content: '当前文档已经修改，需要保存吗？',
			type: 1,
			positive: {
				text: '保存',
				callback: function() {
					editor.save(loadFile);
				}
			},
			negative: {
				text: '不保存',
				callback: loadFile
			}
		});

		function loadFile() {
			editor.readFile(node.path);
			utils.dismissDialog();
			workspace.toggle();
		}
	});

	tree.on('append', function(node, ele) {
		var nodeContainer = ele.querySelector('.tree-node-container');
		bindNodeMenu(nodeContainer, node);
	});

	/*结点菜单*/
	const folderMenuTemplate = [{
		label: '新建'
	}, {
		label: '刷新',
		click: refreshFolder
	}, {
		label: '排序',
		submenu: [{
			label: '名称',
			type: 'checkbox'
		}, {
			label: '修改日期',
			type: 'checkbox'
		}, {
			label: '类型',
			type: 'checkbox'
		}, {
			label: '大小',
			type: 'checkbox'
		}, {
			type: 'separator'
		}, {
			label: '递增',
			type: 'checkbox'
		}, {
			label: '递减',
			type: 'checkbox'
		}]
	}, {
		label: '打开所在目录'
	}];

	const fileMenuTemplate = [{
		label: '打开'
	}, {
		label: '打开所在目录'
	}, {
		type: 'separator'
	}, {
		label: '复制'
	}, {
		label: '剪切'
	}, {
		label: '粘贴'
	}, {
		label: '删除'
	}, {
		label: '重命名'
	}];

	const folderMenu = Menu.buildFromTemplate(folderMenuTemplate);
	const fileMenu = Menu.buildFromTemplate(fileMenuTemplate);
	var currentNode = null;

	function bindNodeMenu(nodeContainer, node) {
		nodeContainer.addEventListener('contextmenu', function(e) {
			e.preventDefault();
			e.stopPropagation();
			var menu = node.children ? folderMenu : fileMenu;
			currentNode = node;
			menu.popup(bw);
		}, false)
	}

	function refreshFolder() {
		listNode(currentNode, true);
	}

	function listNode(node, isNotLazy) {
		if(!node || !node.children || !isNotLazy && node.children.length != 0) return; // 懒加载
		tree.removeChildren(node);
		var nodeArray = [];
		var listFile = fs.readdirSync(node.path);
		for(var i in listFile) {
			var childName = listFile[i];
			var childPath = path.join(node.path, childName);
			var childStat = fs.statSync(childPath);
			if(!childStat.isDirectory() && !path.extname(childName).match(/\.(md|markdown)/)) continue;
			nodeArray.push({
				'name': childName,
				'children': childStat.isDirectory() ? [] : null,
				'path': childPath
			});
		}
		nodeArray.sort(compareNode);
		for(var i in nodeArray) {
			tree.appendNode(nodeArray[i], node);
		}
	}

	function compareNode(node1, node2) {
		if(node1.children && !node2.children) {
			return -1;
		}
		if(!node1.children && node2.children) {
			return 1;
		}
		return node1.name.localeCompare(node2.name);
	}

	/*右键菜单*/
	const workspaceMenu = new Menu()
	workspaceMenu.append(new MenuItem({
		label: '添加本地目录',
		click: workspace.showAddLocalFolderDialog
	}))

	oWorkspaceTree.addEventListener('contextmenu', function(e) {
		e.preventDefault()
		workspaceMenu.popup(bw);
	}, false)

	this.workspace = workspace;
})();