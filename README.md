xupload初级上传插件
=============

初步完成了一个雏形，后续会不断迭代，不断健壮

# 基本用法

## html

```html
<input type="file" accept="image/*" id="file" multiple="multiple">
```

## javascript:

```javascript
var up = $.xupload({
    el: '#file', // || $('#file')
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
     up.triggerUpload(1); // 触发异步upload, autoUpload为false时可用
});

```
# API
## 属性Properties

| Name | Type | Description | Default
| :--  | :-- | :--  | :-- |
| autoUpload | Boolean | 是否自动开始上传 | false
| el | String | 绑定的FileUpload对象，可用形式'.class'、'#id'、'label'，必填 | null
| maxSize | Number | 上传大小限制 | null
| noGif | Boolean | 是否支持gif上传 | false 
| previewWrap | String | 图片预览的对象，可用形式同el，非必填 | null 
| previewImgClass | String | 预览图片的class，方便控制预览样式，直接填入class，在previewWrap存在时生效 | 'x-preview-img' 
| uploadUrl | String | 上传路径，必填 | null 
| uploadParams | Object | 上传时需要传入的参数，非必填 | {} 

## 事件Events

| Name | Type | Description | Return
| :--  | :-- | :--  | :-- |
| start | Function | 开始上传事件回调 | xhr
| done | Function | 上传完成事件回调 | xhr.responseText
| fail | Function | 上传失败事件回调 | xhr
| progress | Function | 上传进度事件回调 | loaded, total
| checkError | Function | 格式校验失败事件回调，返回错误消息数组 | msgQuene

## 方法Methods

| Name | Param Type | Description
| :--  | :-- | :--  |
| triggerUpload | Number | 手动触发文件上传方法，当不传参数时则全部默认全部上传，参数为文件index时则单独上传该文件 | 
| delBefore | Number | 当设置了previewWrap时（即开启了预览模式）有效，参数设置同triggerUpload，预览时删除指定index的图片
| get |  | 获得当前的files数组
| set |  | 配合get使用，可以操作当前的files数组