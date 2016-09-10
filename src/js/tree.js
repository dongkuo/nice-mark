;
(function () {

    HTMLElement.prototype.hasClass = function (cls) {
        return this.className && this.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    };

    HTMLElement.prototype.addClass = function (cls) {
        if (!this.hasClass(cls)) this.className += " " + cls;
    };

    HTMLElement.prototype.removeClass = function (cls) {
        if (this.hasClass(cls)) {
            var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            this.className = this.className.replace(reg, ' ');
        }
    };

    HTMLElement.prototype.removeAllClass = function () {
        this.className = '';
    };

    HTMLElement.prototype.toggleClass = function (cls) {
        if (this.hasClass(cls)) {
            this.removeClass(cls);
        } else {
            this.addClass(cls);
        }
    };

    HTMLElement.prototype.replaceClass = function (oCls, nCls) {
        this.removeClass(oCls);
        this.addClass(nCls);
    };

    HTMLElement.prototype.replaceAllClass = function (nCls) {
        this.removeAllClass();
        this.addClass(nCls);
    };

    function Tree(top) {
        this.id = uuid();
        this.event = {};
        this.top = [];
        this.ele = document.createElement('ul');
        this.ele.setAttribute('id', this.id);
        this.ele.setAttribute('class', 'tree-top-layout');
        this.target = null;
        this.currentNode = null;
        this.appendNode(top, null, true);
    }

    /**
     *
     * 节点的基本信息包括：name，如：{name: '小说'}
     * 可选的信息包括：icon、 toggle、 children，如：{name: '小说', icon: 'icon-file', toggle: true, children: [{name: '巴黎圣母院'},{name: '哈姆雷特'}]}
     *
     */

    /**
     * 添加子节点
     * @param {Object} cNode: 子节点
     * @param {Object} pNode: 父节点
     *
     */
    Tree.prototype.appendNode = function (cNode, pNode, hasPush) {
        if (!cNode) return;
        if (!Array.isArray(cNode)) cNode = new Array(cNode);
        var treeThis = this;
        for (var i in cNode) {
            // 添加信息
            cNode[i]._id = uuid();
            if (!hasPush && pNode) {
                if (pNode.children == undefined) {
                    pNode.children = [];
                }
                pNode.children.push(cNode[i]);
            }
            var nodeEle = Tree.createNodeElement(cNode[i]);
            if (pNode) {
                var pLiEle = this.ele.querySelector('li[node-index="' + pNode._id + '"]');
                var branchEle = pLiEle.querySelector('.tree-node-branch[node-index="' + pNode._id + '"]');
                if (!branchEle) {
                    branchEle = document.createElement('ul');
                    branchEle.addClass('tree-node-branch');
                    branchEle.setAttribute('node-index', pNode._id);
                    pLiEle.appendChild(branchEle);
                    this.updateNode(pNode);
                }
                branchEle.appendChild(nodeEle);
            } else {
                // 添加顶级节点
                this.top.push(cNode[i]);
                this.ele.appendChild(nodeEle);
            }
            nodeEle._node = cNode[i];
            // 绑定事件
            bindEvent(this, cNode[i], nodeEle);
            // 递归
            this.appendNode(cNode[i].children, cNode[i], hasPush);
        }

        function bindEvent(tree, node, nodeEle) {
            var toggleEle = nodeEle.querySelector('.tree-node-toggle[node-index="' + node._id + '"]');
            var containerEle = nodeEle.querySelector('.tree-node-container[node-index="' + node._id + '"]');
            // lfclick
            containerEle.onclick = function (ev) {
                if (tree.event.lfclick instanceof Function) {
                    tree.currentNode = node;
                    tree.event.lfclick.call(tree, node, ev);
                }
            };
            // rtclick
            containerEle.onmousedown = function (ev) {
                if (ev.button == 2 && tree.event.rtclick instanceof Function) {
                    tree.currentNode = node;
                    tree.event.rtclick.call(tree, node, ev);
                }
            };
            // dbclick
            containerEle.ondblclick = function (ev) {
                if (tree.event.dbclick instanceof Function) {
                    tree.currentNode = node;
                    tree.event.dbclick.call(tree, node, ev);
                }
            };
            // toggle
            toggleEle.onclick = function (ev) {
                tree.toggle(node, true);
                if (tree.event.toggle instanceof Function) {
                    tree.currentNode = node;
                    tree.event.toggle.call(tree, node, ev);
                }
            };
            if (tree.event.append instanceof Function) {
                tree.event.append(node, nodeEle);
            }
        }
    };

    /**
     * 删除节点
     * @param {Object} node: 要删除的节点
     */
    Tree.prototype.removeNode = function (node) {
        var nodeEle = this.ele.querySelector('li[node-index="' + node._id + '"]');
        if (nodeEle.parentElement.parentElement._node) {
            for (var i in nodeEle.parentElement.parentElement._node.children) {
                if (nodeEle.parentElement.parentElement._node.children[i] === node) {
                    nodeEle.parentElement.parentElement._node.children.splice(i, 1);
                    break;
                }
            }
        }
        nodeEle.parentNode.removeChild(nodeEle);

    };

    Tree.prototype.removeChildren = function (pNode) {
        pNode.children = [];
        var childrenEle = this.ele.querySelector('.tree-node-branch[node-index="' + pNode._id + '"]');
        if (childrenEle) {
            childrenEle.parentNode.removeChild(childrenEle);
        }
    };

    /**
     * 更新节点
     * @param {Object} node: 要更新的节点
     */
    Tree.prototype.updateNode = function (node) {
        var layoutEle = this.ele.querySelector('.tree-node-layout[node-index="' + node._id + '"]');
        var toggleEle = this.ele.querySelector('.tree-node-toggle[node-index="' + node._id + '"]');
        var iconEle = this.ele.querySelector('.tree-node-icon[node-index="' + node._id + '"]');
        var nameEle = this.ele.querySelector('.tree-node-name[node-index="' + node._id + '"]');
        Tree.updateNodeElement(node, layoutEle, toggleEle, iconEle, nameEle);
        var branchEle = this.ele.querySelector('.tree-node-branch[node-index="' + node._id + '"]');
        if (branchEle) {
            if (node.toggle) {
                branchEle.removeClass('none');
            } else {
                branchEle.addClass('none');
            }
        }
    };

    /**
     * 设置tree到某个节点
     * @param {Object} target
     */
    Tree.prototype.into = function (target) {
        this.target = target;
        target.appendChild(this.ele);
    };

    /**
     * 事件监听
     * @param {Object} ev：toggle | lfclick | rtclick | dbclick
     * @param {Object} callback 回调
     */
    Tree.prototype.on = function (ev, callback) {
        this.event[ev] = callback;
    }

    Tree.prototype.toggle = function (node, force) {
        if (node.toggle) {
            this.off(node, force);
        } else {
            this.open(node, force);
        }
    };

    Tree.prototype.open = function (node, force) {
        if (!node.children) return;
        var branchEle = this.ele.querySelector('.tree-node-branch[node-index="' + node._id + '"]');
        var toggleEle = this.ele.querySelector('.tree-node-toggle[node-index="' + node._id + '"]');
        var iconEle = this.ele.querySelector('.tree-node-icon[node-index="' + node._id + '"]');
        if (branchEle) branchEle.removeClass('none');
        toggleEle.replaceClass('icon-arrow-right', 'icon-arrow-down');
        iconEle.replaceClass('icon-folder', 'icon-folder-open');
        node.toggle = true;
        if (!force && this.event.toggle instanceof Function) this.event.toggle(node);
    };

    Tree.prototype.off = function (node, force) {
        if (!node.children) return;
        var branchEle = this.ele.querySelector('.tree-node-branch[node-index="' + node._id + '"]');
        var toggleEle = this.ele.querySelector('.tree-node-toggle[node-index="' + node._id + '"]');
        var iconEle = this.ele.querySelector('.tree-node-icon[node-index="' + node._id + '"]');
        if (branchEle) branchEle.addClass('none');
        toggleEle.replaceClass('icon-arrow-down', 'icon-arrow-right');
        iconEle.replaceClass('icon-folder-open', 'icon-folder');
        node.toggle = false;
        if (!force && this.event.toggle instanceof Function) this.event.toggle(node);
    };

    /**
     * 创建节点
     *<li>
     *  <div class="tree-node-layout">
     *    <span class="tree-node-toggle"></span>
     *    <span class="tree-node-container">
     *      <span class="tree-node-icon"></span>
     *      <span class="tree-node-name">西游记</span>
     *    </span>
     *  </div>
     *</li>
     *
     */

    Tree.createNodeElement = function (node) {
        var liEle = document.createElement('li');
        var layoutEle = document.createElement('div');
        var toggleEle = document.createElement('span');
        var containerEle = document.createElement('span');
        var iconEle = document.createElement('span');
        var nameEle = document.createElement('span');

        liEle.appendChild(layoutEle);
        layoutEle.appendChild(toggleEle);
        layoutEle.appendChild(containerEle);
        containerEle.appendChild(iconEle);
        containerEle.appendChild(nameEle);

        liEle.setAttribute('node-index', node._id);
        layoutEle.addClass('tree-node-layout');
        layoutEle.setAttribute('node-index', node._id);
        toggleEle.addClass('tree-node-toggle');
        toggleEle.setAttribute('node-index', node._id);
        containerEle.addClass('tree-node-container');
        containerEle.setAttribute('node-index', node._id);
        iconEle.addClass('tree-node-icon');
        iconEle.setAttribute('node-index', node._id);
        nameEle.addClass('tree-node-name');
        nameEle.setAttribute('node-index', node._id);

        Tree.updateNodeElement(node, layoutEle, toggleEle, iconEle, nameEle);
        return liEle;
    };

    Tree.updateNodeElement = function (node, layoutEle, toggleEle, iconEle, nameEle) {
        layoutEle.setAttribute('title', node.name);
        // 设置toggle图标
        if (node.children) {
            if (node.toggle) {
                toggleEle.removeClass('icon-null');
                toggleEle.replaceClass('icon-arrow-right', 'icon-arrow-down');
            } else {
                toggleEle.removeClass('icon-null');
                toggleEle.replaceClass('icon-arrow-down', 'icon-arrow-right');
            }
        } else {
            toggleEle.removeClass('icon-arrow-down');
            toggleEle.removeClass('icon-arrow-right');
            toggleEle.addClass('icon-null');
        }
        toggleEle.addClass('iconfont');
        // 设置name
        nameEle.innerText = node.name;
        // 设置icon图标
        if (node.iconClass) {
            iconEle.removeClass('icon-folder');
            iconEle.removeClass('icon-file');
            iconEle.addClass(node.iconClass);
        } else if (node.children) {
            if (node.toggle) {
                iconEle.replaceClass('icon-file', 'icon-folder-open');
                iconEle.replaceClass('icon-folder', 'icon-folder-open');
            } else {
                iconEle.replaceClass('icon-file', 'icon-folder');
                iconEle.replaceClass('icon-folder-open', 'icon-folder');
            }
        } else {
            iconEle.replaceClass('icon-folder', 'icon-file');
            iconEle.replaceClass('icon-folder-open', 'icon-file');
        }
        iconEle.addClass('iconfont');
    };

    this.Tree = Tree;

    function uuid() {
        var len = 8,
            radix = 8;
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var uuid = [],
            i;
        radix = radix || chars.length;
        if (len) {
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
        } else {
            var r;
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
            uuid[14] = '4';
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
        }
        return uuid.join('');
    }

}).call((function () {
    return this || (typeof window !== 'undefined' ? window : global);
})());