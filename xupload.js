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
            uploadUrl: null, // 上传路径，必填
            uploadParams: {}, // 上传携带参数对象，选填
            maxSize: null, // 上传的最大尺寸，选填
            previewWrap: null,
            previewImgClass: 'x-preview-img',
            autoUpload: false, // 是否自动上传，默认否
            noGif: false, // 是否支持gif上传，默认支持
            start: function () {}, // 开始上传回调
            done: function () {}, // 上传完成回调
            fail: function () {}, // 上传失败回调
            progress: function () {}, // 上传进度回调
            checkError: function () {}, // 检测失败回调
        };

        _this.fileCached = [];
        _this.$root = null;

        // 防止previewImgClass为null或undefine
        if (config.previewImgClass === null || config.previewImgClass === '') {
            config.previewImgClass = _this.defaultConfig.previewImgClass;
        }
        
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
                config = this.config,
                el = config.el,
                isEl = _this._isSelector('el'),
                isPreviewWrap = _this._isSelector('previewWrap');
                
            if (!isEl) {
                throw '请输入正确格式的el值'
            }
            
            if (!isPreviewWrap) {
                throw '请输入正确格式的previewWrap值'
            }
            
            _this.$root = $(el);
            
            _this.$root.each(function () {
                $('body').on('change', el, function (e) {
                    var files = e.target.files;
                    Array.prototype.push.apply(_this.fileCached, files);
                    _this.handler(e, files);
                });
            });
        },
        handler: function (e, files) {
            var _this = this,
                config = this.config,
                fileCached = this.fileCached,
                rules = this.validate(files);
                
            if (rules.result) {
                config.autoUpload && _this.triggerUpload();
                // 暂时只支持图片预览
                if (_this.$root.attr('accept').substr(0, 5) === 'image') {
                    _this.previewBefore();
                }
            } else {
                _this._checkError(rules.msgQuene);
            }
        },
        triggerUpload: function (index) {
            var _this = this,
                files = this.fileCached,
                len = files.length;

            var isIndex = (index >= 0); // 判断是否传入参数（排除index为0时的特殊情况）
            var isValid = /^\d+$/.test(index) && index < len; // 判断传入的index是否为整数，切数目不能大于文件个数

            if (isIndex && isValid) {
                if (len > 1) {
                    _this.upload(files[index]);
                } else if (len === 1) {
                    _this.upload(files[0]);
                }
            } else if (!isIndex && !isValid) {
                if (len > 1) {
                    _this.upload(files);
                } else if (len === 1) {
                    _this.upload(files[0]);
                }
            } else if (isIndex && !isValid) {
                throw 'triggerUpload方法传入的索引值为从0开始的整数且不得大于您上传的文件数'
            }
        },
        upload: function (files) {
            var _this = this,
                uploadParams = this.config.uploadParams,
                xhr = new XMLHttpRequest(),
                data = new FormData(),
                fileRequestName = '',
                len = files.length;
            
            if (len === undefined) {
                len = 1;
            }

            uploadParams.fileRequestName ? 
            fileRequestName = uploadParams.fileRequestName : 
            fileRequestName = 'file[]';

            for (var i = 0; i < len; i++) {
                var file;
                len === 1 ? file = files : file = files[i];
                data.append(fileRequestName, file, file.name);
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
        previewBefore: function () {
            var _this = this,
                files = _this.fileCached,
                filesNeed = [],
                filesHad = [],
                previewWrap = _this.config.previewWrap,
                previewImgClass = _this.config.previewImgClass;

            var $previewWrap = $(previewWrap);

            // 如果已经存在预览位置
            if ($previewWrap.find('.' + previewImgClass).length > 0) {
                $previewWrap.find('.' + previewImgClass).each(function (index, value) {
                    var $this = $(this);
                    filesHad.push($this.data('name'));
                });
                for (var i = 0; i < files.length; i++) {
                    if (filesHad.indexOf(files[i].name) < 0) {
                        filesNeed.push(files[i]);
                    }
                }
            } else {
                filesNeed = files;
            }

            for (var i = 0; i < filesNeed.length; i++) {
                (function (i) {
                    var	reader = new FileReader();
                    reader.readAsDataURL(filesNeed[i]);
                    reader.onload = function () {
                        var dataUrl = reader.result;
                        var img = $('<img src="' + dataUrl + '" class="' + previewImgClass + '" data-name="' + filesNeed[i].name + '"/>');
                        img.appendTo($previewWrap);
                    };
                })(i);
            }  
        },
        delBefore: function (index) {
            var _this = this,
                files = this.fileCached,
                len = files.length,
                previewWrap = _this.config.previewWrap;
                previewImgClass = _this.config.previewImgClass;
            
            var isIndex = (index >= 0); // 判断是否传入参数（排除index为0时的特殊情况）
            var isValid = /^\d+$/.test(index) && index < len; // 判断传入的index是否为整数，切数目不能大于文件个数

            if (isIndex && isValid) {
                files.splice(index, 1);
                $(previewWrap).find('.' + previewImgClass).eq(index).remove();
            } else if (!isIndex && !isValid) {
                $(previewWrap).find('.' + previewImgClass).each(function () {
                    $(this).remove();
                })
            } else if (isIndex && !isValid) {
                throw 'delBefore方法传入的索引值为从0开始的整数且不得大于您上传的文件数'
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
        _isSelector: function (el) {
            var which = this.config[el];
            return Object.prototype.toString.call(which) === '[object String]' && which !== '' && !/^[0-9]+.?[0-9]*$/.test(which);
        }
    }
    $.xupload = function (config) {
        return new Upload(config);
    }
})(window, jQuery)