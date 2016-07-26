/**
 * Created by derek on 16-7-5.
 */
(function() {

	var utils = {};

	/*计算绝对偏移量*/
	utils.getElementAbsoluteOffset = function(ele) {
		var top = 0,
			left = 0,
			srcEle = ele;
		while(ele) {
			left += ele.offsetLeft;
			top += ele.offsetTop;
			// 还要加上parent的border
			if(ele.offsetParent) {
				top += ele.offsetParent.clientTop;
				left += ele.offsetParent.clientLeft;
			}
			ele = ele.offsetParent;
		}
		//减去parent因为滚动而减少的值
		ele = srcEle;
		while(ele && ele.parentElement) {
			top -= ele.parentElement.scrollTop;
			left -= ele.parentElement.scrollLeft;
			ele = ele.parentElement;
		}
		return {
			left: left,
			top: top
		};
	}

	/*动画*/
	var Animation = new Object();
	utils.Animation = Animation;

	Animation.clear = function(id) {
		delete Animation.set[id];
	}

	Animation.clearAll = function() {
		Animation.set = {};
	}

	Animation.set = {};

	Animation.animate = function(interpolator, begin, end, during, callback) {
		if(!callback) return;
		var id = utils.uuid();
		Animation.set[id] = '';
		var time = 0;
		if(callback.start instanceof Function) {
			callback.start();
		}
		requestAnimationFrame(function() {
			if(callback instanceof Function) {
				callback(interpolate(interpolator, time, begin, end, during, 20, 200));
			} else if(callback.update instanceof Function) {
				callback.update(interpolate(interpolator, time, begin, end, during, 20, 200));
			}
			if(Animation.set.hasOwnProperty(id)) {
				if(time != during) {
					if(time > during) {
						time = during;
					} else {
						time += 16;
					}
					requestAnimationFrame(arguments.callee);
				} else if(callback.finish instanceof Function) {
					Animation.clear(id);
					callback.finish();
				}
			}
		});
		return id;

		function interpolate(interpolator, time, begin, end, during) {
			switch(interpolator) {
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
				if(t == 0) return b;
				if((t /= d) == 1) return b + c;
				if(!p) p = d * .3;
				if(!a || a < Math.abs(c)) {
					a = c;
					var s = p / 4;
				} else var s = p / (2 * Math.PI) * Math.asin(c / a);
				return(a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
			}

			function expoEaseOut(t, b, e, d) {
				return(t == d) ? e : (e - b) * (-Math.pow(2, -10 * t / d) + 1) + b;
			}

			function linear(t, b, e, d) {
				return Animation.mapValueInRange(t, 0, d, b, e);
			}
		}
	}

	Animation.mapValueInRange = function(value, fromLow, fromHigh, toLow, toHigh) {
		if(value == fromLow) return toLow;
		if(value == fromHigh) return toHigh;
		fromRangeSize = fromHigh - fromLow;
		toRangeSize = toHigh - toLow;
		valueScale = (value - fromLow) / fromRangeSize;
		return toLow + (valueScale * toRangeSize);
	};

	/*生成uuid*/
	utils.uuid = function() {
		var len = 8,
			radix = 8;
		var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
		var uuid = [],
			i;
		radix = radix || chars.length;
		if(len) {
			for(i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
		} else {
			var r;
			uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
			uuid[14] = '4';
			for(i = 0; i < 36; i++) {
				if(!uuid[i]) {
					r = 0 | Math.random() * 16;
					uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
				}
			}
		}
		return uuid.join('');
	};

	/*添加快捷键*/
	var hotKeyMap = {};

	utils.addHotKey = function(hotKey, callback) {
		var SHIFT_CODE = 1000;
		var CTRL_CODE = 2000;
		var ALT_CODE = 4000;
		hotKey = hotKey.replace(/\s+/g, "").toLocaleLowerCase();
		var code = 0;
		if(hotKey.match("\\+")) {
			// 组合按键
			var keys = hotKey.split("+")
			for(key in keys) {
				if(keys[key] == "shift") {
					code += SHIFT_CODE;
				} else if(keys[key] == "ctrl") {
					code += CTRL_CODE;
				} else if(keys[key] == "alt") {
					code += ALT_CODE;
				} else {
					var unicode = keys[key].charCodeAt();
					if(unicode >= 97 && unicode <= 122) {
						// 字母
						code += unicode - 97 + 65;
					} else {
						// 数字
						code += unicode;
					}
				}
			}
		} else {
			// 单按键（F1~F12）
			if(hotKey.match("f[0-9]{1,2}")) {
				try {
					var num = Number(hotKey.substr(1));
					if(num >= 1 && num <= 12) {
						hotKey = 112 + num - 1;
					}
				} catch(e) {
					hotKey = -1;
				}
			} else {
				hotKey = -1;
			}
		}
		hotKeyMap[code] = callback;

		// keyCode : 0~9 = 48~57, a~z = 65~90, f1~f12 = 112~123
		// unicode: 0~9 = 48~57, a~z = 97 ~ 122
		document.onkeydown = function(e) {
			var code = e.keyCode;
			if(e.shiftKey) {
				code += SHIFT_CODE;
			}
			if(e.ctrlKey) {
				code += CTRL_CODE;
			}
			if(e.altKey) {
				code += ALT_CODE;
			}
			if(hotKeyMap[code] instanceof Function) {
				hotKeyMap[code]();
			}
		};
	}

	/*radio group*/
	var aRadio = document.querySelectorAll('.radio-group');
	for(var i = 0; i < aRadio.length; i++) {
		var aRadioItem = aRadio[i].querySelectorAll('.radio-group-item');
		for(var j = 0; j < aRadioItem.length; j++) {
			(function(oRadio, aRadioItem, j) {
				aRadioItem[j].onclick = function() {
					for(var k = 0; k < aRadioItem.length; k++) {
						aRadioItem[k].removeAttribute('selected');
					}
					this.setAttribute('selected', '');
					if(typeof(oRadio.onselect) == 'function') {
						oRadio.onselect(j);
					}
				}
			})(aRadio[i], aRadioItem, j);
		}
	}

	/*checkbox*/
	var aCheckbox = document.querySelectorAll('.checkbox');
	for(var i = 0; i < aCheckbox.length; i++) {
		aCheckbox[i].onclick = function() {
			var isChecked = this.hasAttribute('checked');
			if(isChecked)
				this.removeAttribute('checked');
			else
				this.setAttribute('checked', '');
			if(typeof(this.onchange) == 'function')
				this.onchange(!isChecked);
		}
	}

	utils.fs = require('fs');

	this.utils = utils;
})();