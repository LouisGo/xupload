/**
 * @description 初级图片上传组件
 * @author xlzgogogo@foxmail.com
 * @returns {function} 
 * @example
 * var up = $.xupload({
        el: '#file' || $('#file'),
        uploadUrl: '/test',
        uploadParams: {
            fileRequestName: 'uploadfile' || undefined,
            param1: 1,
            param2, 2
        },
        autoUpload: false || true,
        maxSize: 2000,
        noGif: true || false,
        start: function (files) {
            console.dir(files);
        },
        done: function (res) {
            console.dir(res);	
        },
        fail: function (error) {
            console.error(error);
        },
        progress: function (loaded, total) {
            console.log(Math.round(loaded / total * 100) + '%');
        },
        checkError: function (errors) {
            console.error(errors);
        }
 * });
 * $('#someSubmitBtn').click(function () {
 *      var files = up.get();
 *      console.dir(files);
 *      up.triggerUpload(); // 触发异步upload
 * })
 */
;(function (window, $) {
    function Upload(config) {
        var _this = this;
        _this.uploading = false; // 设置传输状态初始值

        _this.defaultConfig = {
            el: null, // 绑定的元素，必填
            uploadUrl: '', // 上传路径，必填
            uploadParams: {}, // 上传携带参数对象，选填
            maxSize: null, // 上传的最大尺寸，选填
            autoUpload: false, // 是否自动上传，默认否
            noGif: false, // 是否支持gif上传，默认支持
            start: function () {}, // 开始上传回调
            done: function () {}, // 上传完成回调
            fail: function () {}, // 上传失败回调
            progress: function () {}, // 上传进度回调
            checkError: function () {}, // 检测失败回调
            previewBefore: function () {}, // 上传前预览方法，目前需要自定义，建议采用FileReader base64展现
        };

        _this.fileCached = [];
        _this.$root = null;
        
        if (config && $.isPlainObject(config)) {
            _this.config = $.extend({}, _this.defaultConfig, config);
        } else {
            _this.config = _this.defaultConfig;
            _this.isDefault = true;
        }
        _this.init();
    }

    Upload.prototype = {
        init: function () {
            var _this = this,
                config = this.config;
            var el = config.el;
            if (el && el instanceof jQuery) {
                el = el.selector;
            }
            _this.$root = $(el);
            $(el).each(function () {
                $('body').on('change', el, function (e) {
                    var files = e.target.files;
                    _this.fileCached = $.extend({}, files);
                    _this.handler(e, files);
                })
            })
        },
        handler: function (e, files) {
            var _this = this,
                config = this.config,
                fileCached = this.fileCached,
                rules = this.validate(files);

            if (rules.result) {
                if (config.autoUpload) {
                    // custom temporary: 暂时先服务于业务定制
                    _this.triggerUpload();
                }
                _this._previewBefore(files);
            } else {
                _this._checkError(rules.msgQuene);
            }
        },
        triggerUpload: function name() {
            var _this = this,
                files = this.fileCached,
                len = files.length;
            if (len > 1) {
                _this.upload(files);
            } else {
                _this.upload(files[0]);
            }
        },
        upload: function (files) {
            var _this = this,
                uploadParams = this.config.uploadParams,
                xhr = new XMLHttpRequest(),
                data = new FormData(),
                fileRequestName = '';

            uploadParams.fileRequestName ? 
            fileRequestName = uploadParams.fileRequestName : 
            fileRequestName = 'file[]';

            for (var i = 0, len = files.length; i < len; i++) {
                var file = files[i];
                data.append(fileRequestName, file);
            }

            if (uploadParams) {
                for (var key in uploadParams) {
                    if (key !== 'fileRequestName') {
                        data.append(key, uploadParams[key]);
                    }
				}
            }

            // 上传开始
            xhr.onloadstart = function (e) {
                _this._loadStart(e, xhr);
            };

            // 上传结束
            xhr.onload = function (e) {
                _this._loaded(e, xhr);
            }

            // 上传错误
            xhr.onerror = function (e) {
                _this._loadFailed(e, xhr);
            };

            // 上传进度
            xhr.upload.onprogress = function (e) {
                _this._loadProgress(e, xhr);
            }

            // 发送请求
            xhr.open('post', _this.config.uploadUrl);
            xhr.send(data);
        },
        validate: function (files) {
            var _this = this,
                len = files.length,
                msgQuene = [],
                matchCount = 0;
            
            if (len > 1) {
                for (var i = 0; i < len; i++) {
                    (function (index) {
                        var result = _this.rules(files[index], index);
                        result.flag ? matchCount++ : msgQuene.push(result.msg);
                    })(i);
                }
            } else {
                var result = _this.rules(files[0]);
                result.flag ? matchCount++ : msgQuene.push(result.msg);
            }
            if (matchCount === len) {
                return {
                    result: true
                };
            } else {
                return {
                    result: false,
                    msgQuene: msgQuene
                };
            }
        },
        rules: function (item, index) {
            var config = this.config,
                flag = true,
                msg = '';
            if (config.noGif) {
                if (item.type === 'image/gif') {
                    flag = false;
                    msg = '不支持上传gif格式的图片'
                }
            }
            if (config.maxSize) {
                if (item.size > config.maxSize) {
                    flag = false;
                    index >= 0 ? 
                    msg = '第' + (index + 1) + '个文件过大，请重新上传': 
                    msg = '文件过大，请重新上传';
                }
            }
            return {
                flag: flag,
                msg: msg
            }
        },
        get: function () {
            return this.fileCached;
        },
        set: function (files) {
            this.fileCached = files;
        },
        _loadStart: function (e, xhr) {
            this.uploading = true;
            this.config.start.call(this, xhr);
        },
        _loaded: function (e, xhr) {
            if (xhr.status === 200 || xhr.status === 304) {
                this.uploading = false;
                var res = JSON.parse(xhr.responseText);
                this.config.done.call(this, res);
            } else {
                this._loadFailed(e, xhr);
            }
        },
        _loadFailed: function (e, xhr) {
            this.uploading = false;            
            this.config.fail.call(this, xhr);
        },
        _loadProgress: function (e, xhr) {
            if (e.lengthComputable) {
                this.config.progress.call(this, e.loaded, e.total);
            }
        },
        _checkError: function (msgQuene) {
            this.config.checkError.call(this, msgQuene);
        },
        _previewBefore: function (files) {
            this.config.previewBefore.call(this, files);
        },
    }
    $.xupload = function (config) {
        return new Upload(config);
    }
})(window, jQuery)