(function () {

    HTMLElement.prototype.one = function (ev, callback) {
        this['on' + ev] = function (ev) {
            callback.call(this, ev);
            this['on' + ev] = null;
        };
    };

    const utils = {};
    const colorArray = ['#03A9F4', '#FF5722', '#F44336'];

    /*dialog*/
    var messageDialog = document.getElementById('message-dialog');

    // option (Object): title, content, cancelable, callback, type
    utils.showDialog = function (option, ele) {
        ele = ele || messageDialog;
        if (!ele || ele.isShowing) {
            return;
        }
        ele.isShowing = true;
        var dialogContainer = ele.querySelector('.dialog-container');
        if (!dialogContainer) {
            return;
        }
        if (option) {
            if (!option.type) {
                option.type = 0;
            }
            dialogContainer.style['border-left-color'] = colorArray[option.type];
            if (option.title) {
                var dialogTitle = dialogContainer.querySelector('.dialog-title');
                if (dialogTitle) {
                    dialogTitle.innerText = option.title;
                    dialogTitle.style.color = colorArray[option.type];
                }
            }
            if (option && option.content) {
                var dialogContent = dialogContainer.querySelector('.dialog-content');
                if (dialogContent) {
                    dialogContent.innerText = option.content;
                }
            }
            var positiveBtn = dialogContainer.querySelector('.btn-positive');
            var negativeBtn = dialogContainer.querySelector('.btn-negative');
            if (positiveBtn) {
                positiveBtn.style.color = colorArray[option.type];
                if (option.positive instanceof Function) {
                    positiveBtn.onclick = option.positive;
                } else if (option.positive) {
                    if (option.positive.text) {
                        positiveBtn.textContent = option.positive.text;
                    }
                    if (option.positive.callback) {
                        positiveBtn.onclick = option.positive.callback;
                    }
                }
            }
            if (negativeBtn) {
                negativeBtn.style.display = option.negative ? 'inline' : 'none';
                if (option.negative) {
                    negativeBtn.style.color = colorArray[option.type];
                    if (option.negative instanceof Function) {
                        negativeBtn.onclick = option.negative;
                    } else if (option.negative) {
                        if (option.negative.text) {
                            negativeBtn.textContent = option.negative.text;
                        }
                        if (option.negative.callback) {
                            negativeBtn.onclick = option.negative.callback;
                        }
                    }
                }
            }
            if (option.cancelable || typeof option.cancelable == 'undefined') {
                ele.setAttribute('cancelable', '');
            } else {
                ele.removeAttribute('cancelable');
            }
        }
        ele.style.display = 'block';
        utils.Animation.animate('expoEaseOut', 0, 1, 300, function (value) {
            ele.style.opacity = value;
            dialogContainer.style['margin-top'] = Animation.mapValueInRange(value, 0, 1, 150, 200) + 'px';
        });
    };

    utils.dismissDialog = function (ele) {
        ele = ele || messageDialog;
        ele.isShowing = false;
        var dialogContainer = ele.querySelector('.dialog-container');
        if (!dialogContainer) {
            return;
        }
        utils.Animation.animate('expoEaseOut', 1, 0, 300, {
            update: function (value) {
                ele.style.opacity = value;
                dialogContainer.style['margin-top'] = Animation.mapValueInRange(value, 1, 0, 200, 150) + 'px';
            },
            finish: function () {
                ele.style.display = 'none';
            }
        });
    };

    var aDialog = document.querySelectorAll('.dialog-layout');
    var aDialogDismiss = document.querySelectorAll('*[dialog-dismiss]');
    for (i = 0; aDialog && i < aDialog.length; i++) {
        aDialog[i].onclick = function (ev) {
            if (ev.target == this && this.getAttribute('cancelable') != null)
                utils.dismissDialog(this);
        }
    }
    for (i = 0; aDialogDismiss && i < aDialogDismiss.length; i++) {
        aDialogDismiss[i].onclick = function () {
            utils.dismissDialog(document.querySelector('#' + this.getAttribute('dialog-dismiss')));
        }
    }
    /*toast*/
    var toastLayout = document.getElementById('toast-layout');
    var toastContainer = document.getElementById('toast-container');
    utils.showToast = function (text, type, callback) {
        if (toastLayout.style.display === 'block') {
            return;
        }
        toastLayout.style.display = 'block';
        toastContainer.innerText = text;
        if (!type) {
            type = 0;
        }
        toastContainer.style.backgroundColor = colorArray[type];
        Animation.animate('expoEaseOut', 0, 1, 300, {
            update: function (value) {
                toastContainer.style.opacity = value;
                toastLayout.style.top = Animation.mapValueInRange(value, 0, 1, 140, 150) + 'px';
            },
            finish: function () {
                setTimeout(function () {
                    Animation.animate('expoEaseOut', 1, 0, 300, {
                        update: function (value) {
                            toastContainer.style.opacity = value;
                            toastLayout.style.top = Animation.mapValueInRange(value, 1, 0, 150, 140) + 'px';
                        },
                        finish: function () {
                            toastLayout.style.display = 'none';
                            if (callback instanceof Function) callback();
                        }
                    });
                }, type ? type * 1500 : 1500);
            }
        });

    };

    /*计算绝对偏移量*/
    utils.getElementAbsoluteOffset = function (ele) {
        var top = 0,
            left = 0,
            srcEle = ele;
        while (ele) {
            left += ele.offsetLeft;
            top += ele.offsetTop;
            // 还要加上parent的border
            if (ele.offsetParent) {
                top += ele.offsetParent.clientTop;
                left += ele.offsetParent.clientLeft;
            }
            ele = ele.offsetParent;
        }
        //减去parent因为滚动而减少的值
        ele = srcEle;
        while (ele && ele.parentElement) {
            top -= ele.parentElement.scrollTop;
            left -= ele.parentElement.scrollLeft;
            ele = ele.parentElement;
        }
        return {
            left: left,
            top: top
        };
    };

    /*动画*/
    var Animation = {};
    utils.Animation = Animation;

    Animation.clear = function (id) {
        delete Animation.set[id];
    };

    Animation.clearAll = function () {
        Animation.set = {};
    };

    Animation.set = {};

    Animation.animate = function (interpolator, begin, end, during, callback) {
        if (!callback) return;
        var id = utils.uuid();
        Animation.set[id] = '';
        var time = 0;
        if (callback.start instanceof Function) {
            callback.start();
        }
        requestAnimationFrame(function () {
            if (callback instanceof Function) {
                callback(interpolate(interpolator, time, begin, end, during, 20, 200));
            } else if (callback.update instanceof Function) {
                callback.update(interpolate(interpolator, time, begin, end, during, 20, 200));
            }
            if (Animation.set.hasOwnProperty(id)) {
                if (time != during) {
                    if (time > during) {
                        time = during;
                    } else {
                        time += 16;
                    }
                    requestAnimationFrame(arguments.callee);
                } else if (callback.finish instanceof Function) {
                    Animation.clear(id);
                    callback.finish();
                }
            }
        });
        return id;

        function interpolate(interpolator, time, begin, end, during) {
            switch (interpolator) {
                case 'elasticEaseOut':
                    return elasticEaseOut(time, begin, end, during, 20, 200);
                case 'expoEaseOut':
                    return expoEaseOut(time, begin, end, during);
                case 'linear':
                    return linear(time, begin, end, during);
                default:
                    console.log(interpolator);
                    console.warn('没有该插值器');
            }

            // 弹性插值
            function elasticEaseOut(t, b, e, d, a, p) {
                var c = e - b;
                if (t == 0) return b;
                if ((t /= d) == 1) return b + c;
                if (!p) p = d * .3;
                if (!a || a < Math.abs(c)) {
                    a = c;
                    var s = p / 4;
                } else s = p / (2 * Math.PI) * Math.asin(c / a);
                return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
            }

            function expoEaseOut(t, b, e, d) {
                return (t == d) ? e : (e - b) * (-Math.pow(2, -10 * t / d) + 1) + b;
            }

            function linear(t, b, e, d) {
                return Animation.mapValueInRange(t, 0, d, b, e);
            }
        }
    };

    Animation.mapValueInRange = function (value, fromLow, fromHigh, toLow, toHigh) {
        if (value == fromLow) return toLow;
        if (value == fromHigh) return toHigh;
        fromRangeSize = fromHigh - fromLow;
        toRangeSize = toHigh - toLow;
        valueScale = (value - fromLow) / fromRangeSize;
        return toLow + (valueScale * toRangeSize);
    };

    /*生成uuid*/
    utils.uuid = function () {
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
    };

    /*添加快捷键*/
    var hotKeyMap = {};
    var SHIFT_CODE = 1000;
    var CTRL_CODE = 2000;
    var ALT_CODE = 4000;

    utils.addHotKey = function (hotKey, callback) {
        hotKey = hotKey.replace(/\s+/g, "").toLocaleLowerCase();
        var code = 0;
        if (hotKey.match(/\+/)) {
            // 组合按键
            var keys = hotKey.split("+");
            for (var key in keys) {
                if (keys[key] == "shift") {
                    code += SHIFT_CODE;
                } else if (keys[key] == "ctrl") {
                    code += CTRL_CODE;
                } else if (keys[key] == "alt") {
                    code += ALT_CODE;
                } else {
                    var unicode = keys[key].charCodeAt();
                    if (unicode >= 97 && unicode <= 122) {
                        // 字母
                        code += unicode - 97 + 65;
                    } else {
                        // 数字
                        code += unicode;
                    }
                }
            }
        }
        hotKeyMap[code] = callback;

        // keyCode : 0~9 = 48~57, a~z = 65~90, f1~f12 = 112~123
        // unicode: 0~9 = 48~57, a~z = 97 ~ 122
        document.onkeydown = function (e) {
            var code = e.keyCode;
            if (e.shiftKey) {
                code += SHIFT_CODE;
            }
            if (e.ctrlKey) {
                code += CTRL_CODE;
            }
            if (e.altKey) {
                code += ALT_CODE;
            }
            if (hotKeyMap[code] instanceof Function) {
                hotKeyMap[code]();
            }
        };
    };

    utils.zoom = function (imageEle) {
        if (imageEle.zooming) return;
        if (imageEle.getAttribute('zoom-in') == null) {
            zoomIn();
        } else {
            zoomOut();
        }

        function zoomIn() {
            // 保存原始信息，供zoomOut时恢复
            imageEle.srcCssText = imageEle.style.cssText;
            imageEle.srcWidth = imageEle.width;
            imageEle.srcHeight = imageEle.height;
            imageEle.srcAbsOffset = utils.getElementAbsoluteOffset(imageEle);
            // 判断是否进行过初始化
            if (!imageEle.coverEle) {
                var newImg = new Image();
                newImg.src = imageEle.src;
                imageEle.realWidth = newImg.width;
                imageEle.realHeight = newImg.height;
                imageEle.boxEle = document.createElement('div');
                imageEle.coverEle = document.createElement('div');
                imageEle.titleEle = document.createElement('div');
                imageEle.parentElement.insertBefore(imageEle.boxEle, imageEle);
                imageEle.boxEle.appendChild(imageEle);
                imageEle.coverEle.style.cssText = 'width: 100%; height: 100%;background: rgba(29, 29, 29, .8);z-index: 999;position: fixed; top:0;left:0';
                imageEle.coverEle.appendChild(imageEle.titleEle);
                imageEle.titleEle.style.cssText = 'width: 100%;font-size: 15px;color: #FFFFFF; font-family: "lucida grande", "lucida sans unicode", lucida, helvetica, "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;position: absolute; text-align: center; bottom: 8px';
                imageEle.titleEle.innerText = imageEle.title;
                document.body.appendChild(imageEle.coverEle);
                newImg = null;
            }
            imageEle.setAttribute('zoom-in', '');
            var scaledWidth = 0,
                scaledHeight = 0,
                posLeft = 0,
                posTop = 16,
                visualWidth = window.innerWidth,
                visualHeight = window.innerHeight - 56;
            if (imageEle.realWidth <= visualWidth && imageEle.realHeight <= visualHeight) {
                scaledWidth = imageEle.realWidth;
                scaledHeight = imageEle.realHeight;
            } else {
                var widthRatio = imageEle.realWidth / visualWidth;
                var heightRatio = imageEle.realHeight / visualHeight;
                if (widthRatio < heightRatio) {
                    scaledWidth = imageEle.realWidth / heightRatio;
                    scaledHeight = visualHeight;
                } else {
                    scaledWidth = visualWidth;
                    scaledHeight = imageEle.realHeight / widthRatio;
                }
            }
            posLeft += (visualWidth - scaledWidth) / 2;
            posTop += (visualHeight - scaledHeight) / 2;
            Animation.animate('expoEaseOut', 0, 1, 350, {
                start: function () {
                    imageEle.boxEle.style.cssText = 'width: ' + imageEle.width + 'px;height:' + imageEle.height + 'px;';
                    imageEle.coverEle.style.display = 'block';
                    imageEle.style['z-index'] = 1000;
                    imageEle.style.position = 'fixed';
                    imageEle.zooming = true;
                },
                update: function (data) {
                    imageEle.coverEle.style.opacity = data;
                    imageEle.style.width = Animation.mapValueInRange(data, 0, 1, imageEle.srcWidth, scaledWidth) + 'px';
                    imageEle.style.height = Animation.mapValueInRange(data, 0, 1, imageEle.srcHeight, scaledHeight) + 'px';
                    imageEle.style.left = Animation.mapValueInRange(data, 0, 1, imageEle.srcAbsOffset.left, posLeft) + 'px';
                    imageEle.style.top = Animation.mapValueInRange(data, 0, 1, imageEle.srcAbsOffset.top, posTop) + 'px';
                },
                finish: function () {
                    imageEle.zooming = false;
                }
            });
            imageEle.style['max-width'] = 'none';
            imageEle.style['max-height'] = 'none';
            imageEle.coverEle.onclick = zoomOut;
        }

        function zoomOut() {
            var currWidth = imageEle.width;
            var cuurHeight = imageEle.height;
            var currLeft = parseInt(imageEle.style.left);
            var currTop = parseInt(imageEle.style.top);
            Animation.animate('expoEaseOut', 1, 0, 300, {
                start: function () {
                    imageEle.zooming = true;
                },
                update: function (data) {
                    imageEle.coverEle.style.opacity = data;
                    imageEle.style.width = Animation.mapValueInRange(data, 1, 0, currWidth, imageEle.srcWidth) + 'px';
                    imageEle.style.height = Animation.mapValueInRange(data, 1, 0, cuurHeight, imageEle.srcHeight) + 'px';
                    imageEle.style.left = Animation.mapValueInRange(data, 1, 0, currLeft, imageEle.srcAbsOffset.left) + 'px';
                    imageEle.style.top = Animation.mapValueInRange(data, 1, 0, currTop, imageEle.srcAbsOffset.top) + 'px';
                },
                finish: function () {
                    imageEle.boxEle.style.cssText = '';
                    imageEle.coverEle.style.display = 'none';
                    imageEle.style.cssText = imageEle.srcCssText;
                    imageEle.removeAttribute('zoom-in');
                    imageEle.zooming = false;
                }
            });
        }
    };

    /*radio group*/
    var aRadio = document.querySelectorAll('.radio-group');
    for (var i = 0; i < aRadio.length; i++) {
        var aRadioItem = aRadio[i].querySelectorAll('.radio-group-item');
        for (var j = 0; j < aRadioItem.length; j++) {
            (function (oRadio, aRadioItem, j) {
                aRadioItem[j].onclick = function () {
                    for (var k = 0; k < aRadioItem.length; k++) {
                        aRadioItem[k].removeAttribute('selected');
                    }
                    this.setAttribute('selected', '');
                    if (typeof(oRadio.onselect) == 'function') {
                        oRadio.onselect(j);
                    }
                }
            })(aRadio[i], aRadioItem, j);
        }
    }

    /*checkbox*/
    var aCheckbox = document.querySelectorAll('.checkbox');
    for (i = 0; i < aCheckbox.length; i++) {
        aCheckbox[i].onclick = function () {
            var isChecked = this.hasAttribute('checked');
            if (isChecked)
                this.removeAttribute('checked');
            else
                this.setAttribute('checked', '');
            if (typeof(this.onchange) == 'function')
                this.onchange(!isChecked);
        }
    }

    /*遮罩*/
    var oCover = document.getElementById("cover");
    utils.showCover = function () {
        utils.Animation.animate('expoEaseOut', 0, 0.5, 300, {
            'start': function () {
                oCover.style.opacity = "0";
                oCover.style.display = "block";
            },
            'update': function (value) {
                oCover.style.opacity = value;
            }
        });
        return oCover;
    }

    utils.dismissCover = function () {
        utils.Animation.animate('expoEaseOut', 0.5, 0, 300, {
            'update': function (value) {
                oCover.style.opacity = value;
            },
            'finish': function () {
                oCover.style.display = "none";
            }
        });
    };

    this.utils = utils;
})();