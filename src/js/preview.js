(function() {
	var oPreview = document.getElementById('preview');
	
	// 设置预览内容
	editor.onchange(function(value){
		oPreview.innerHTML = marked(value);
	});
	
})();