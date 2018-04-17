# xupload初级上传插件

初步完成了一个雏形，后续会不断迭代，不断健壮

## 基本用法

html: 

```
<input type="file" accept="image/*" id="file" multiple="multiple">
```
javascript: 

```
var up = $.xupload({
    el: '#file' || $('#file'),
    uploadUrl: '/test',
    uploadParams: {
        fileRequestName: 'uploadfile', // || undefined
        param1: 1,
        param2, 2
    },
    autoUpload: false, // || true,
    maxSize: 2000,
    noGif: true, // || false
    start: function (files) {
        console.dir(files);
    },
    done: function (res) {
        console.dir(res); // 上传成功responce
    },
    fail: function (error) {
        console.error(error);
    },
    progress: function (loaded, total) {
        console.log(Math.round(loaded / total * 100) + '%');
    },
    checkError: function (errors) {
        console.error(errors); // 得到验证失败数组
    }
});

$('#someSubmitBtn').click(function () {
     var files = up.get(); // 获取待上传的文件
     console.dir(files);
     up.triggerUpload(); // 触发异步upload, autoUpload为false时可用
});

```