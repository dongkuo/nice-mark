# 已停止维护！！！

![NiceMark](src/img/icon.png)

# NiceMark

## 1. 简介

**NiceMark**是一款基于[electron](https://github.com/electron/electron)的markdown编辑器。它外观简洁，使用简单，开源免费，欢迎使用。

下面是软件的截图：

![截图1](src/screenshot/NiceMark_001.png)

![截图2](src/screenshot/NiceMark_002.png)

![截图3](src/screenshot/NiceMark_003.png)

![截图4](src/screenshot/NiceMark_004.png)

## 2. 安装

**第一步：** 在[electron官网](http://electron.atom.io/)下载相应平台下的electron压缩包，也可以在这个[镜像站](https://npm.taobao.org/mirrors/electron)下载，解压；

**第二步：** 在解压后的文件中找到`resources`文件夹，删除里面的`default_app.asar`文件；将源码的`src`目录重命名为`app`，拷贝到`resources`文件夹中；

**第三步：** 运行electron(.exe)文件。

目录结构如下图：

![目录结构](src/screenshot/directory_structure.png)

## 3. 快捷键

一般规则：
- 行内元素：Ctrl + Shift + key；
- 行间元素：Ctrl(Alt) + key;

具体的：

**行间:**

|    元素                    |    快捷键    | 
|--------------------- |------------- |
|    hr（分割线）    |    Ctrl + h    | 
|    ul（无序列表）|    Ctrl + u    | 
|    ol（有序列表）|    Ctrl + o    | 
|    table（表格）   |    Ctrl + t    | 
| quotation（引用）|    Ctrl + q | 
| math（Latex）      |    Ctrl + m  | 
| image（图片）   |    Ctrl + g    | 
| code（代码）     |    Alt +  c     | 

**行内:**

|    元素                    |    快捷键    | 
|--------------------- |------------- |
|    bold（加粗）    |    Ctrl + Shift + b    | 
|    italic（斜体）   |    Ctrl + Shift + i    | 
|    link（链接）     |    Ctrl + Shift + l    | 
|math_inline（Latex） |    Ctrl + Shift + m    | 
| code_inline（代码）|    Ctrl + Shift + c  | 


## 4. 下一步计划

1. html、pdf导出；
2. 文档云存储。
