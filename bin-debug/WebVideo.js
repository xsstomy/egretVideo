var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * 视频播放器
 * @author xsstomy
 * @weixin: xsstomy1990
 */
var WebVideo = (function (_super) {
    __extends(WebVideo, _super);
    /**
     * @inheritDoc
     */
    function WebVideo(url, autoplay) {
        if (autoplay === void 0) { autoplay = false; }
        var _this = _super.call(this) || this;
        /**
         * @private
         */
        _this.loaded = false;
        /**
         * @private
         */
        _this.closed = false;
        /**
         * @private
         */
        _this.heightSet = NaN;
        /**
         * @private
         */
        _this.widthSet = NaN;
        /**
         * @private
         * pc上视频卡住的时候不能暂停
         */
        _this.waiting = false;
        /**
         * @private
         * 用户是否设置了 pause
         */
        _this.userPause = false;
        /**
         * @private
         * 用户是否设置了 play
         */
        _this.userPlay = false;
        /**
         * 初次加载自动播放
         */
        _this.autoplay = false;
        /**
         * 循环播放
         */
        _this._loop = false;
        _this.isPlayed = false;
        _this._fullscreen = false;
        /**
         * @private
         *
         */
        _this.onVideoLoaded = function () {
            _this.video.removeEventListener("canplay", _this.onVideoLoaded);
            var video = _this.video;
            _this.loaded = true;
            //video.pause();
            if (_this.posterData) {
                _this.posterData.width = _this.getPlayWidth();
                _this.posterData.height = _this.getPlayHeight();
            }
            video.width = video.videoWidth;
            video.height = video.videoHeight;
            if (_this.autoplay) {
                _this.play();
                _this.autoplay = false;
            }
            _this.$invalidateContentBounds();
            window.setTimeout(function () {
                _this.dispatchEventWith(egret.Event.COMPLETE);
            }, 200);
        };
        //====================================
        _this.scale = 1;
        _this.$renderNode = new egret['sys'].BitmapNode();
        _this.src = url;
        _this.autoplay = autoplay;
        _this.once(egret.Event.ADDED_TO_STAGE, _this.loadPoster, _this);
        // this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAdded, this);
        // this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemoved, this);
        if (url) {
            _this.load();
        }
        return _this;
    }
    /**
     * @inheritDoc
     */
    WebVideo.prototype.load = function (url, cache) {
        var _this = this;
        if (cache === void 0) { cache = true; }
        url = url || this.src;
        this.src = url;
        if (true && !url) {
            egret.$error(3002);
        }
        if (this.video && this.video.src == url && cache) {
            return;
        }
        var video;
        if (!this.video) {
            video = document.createElement("video");
            this.video = video;
            video.controls = null;
        }
        else {
            video = this.video;
        }
        video.src = url;
        video.setAttribute("webkit-playsinline", "true");
        video.setAttribute("playsinline", "true");
        video.setAttribute("x5-playsinline", "true");
        video.setAttribute("preload", "none");
        video.setAttribute("id", "egretWebVideo");
        video.addEventListener("canplay", this.onVideoLoaded);
        video.addEventListener("error", function () { return _this.onVideoError(); });
        video.addEventListener("ended", function () { return _this.onVideoEnded(); });
        var firstPause = false;
        video.addEventListener("canplay", function () {
            _this.waiting = false;
            if (!firstPause) {
                firstPause = true;
                video.pause();
            }
            else {
                if (_this.userPause) {
                    _this.pause();
                }
                else if (_this.userPlay) {
                    _this.play();
                }
            }
        });
        video.addEventListener("waiting", function () {
            _this.waiting = true;
        });
        video.load();
        video.style.overflow = "hidden";
        video.style.transformOrigin = "0 0 0";
        video.style.position = "absolute";
        video.style.zIndex = "-88888";
        video.width = 1;
        video.height = 1;
    };
    /**
     * @inheritDoc
     */
    WebVideo.prototype.play = function (startTime, loop) {
        var _this = this;
        if (loop === void 0) { loop = false; }
        if (this.loaded == false) {
            this.load(this.src);
            this.once(egret.Event.COMPLETE, function (e) { return _this.play(startTime, loop); }, this);
            return;
        }
        if (loop) {
            this._loop = true;
        }
        this.isPlayed = true;
        var video = this.video;
        if (startTime != undefined) {
            video.currentTime = +startTime || 0;
        }
        video.loop = !!loop;
        video.height = video.videoHeight;
        video.width = video.videoWidth;
        this.videoPlay();
    };
    WebVideo.prototype.videoPlay = function () {
        this.userPause = false;
        if (this.waiting) {
            this.userPlay = true;
            return;
        }
        this.userPlay = false;
        this.video.play();
        egret.startTick(this.markDirty, this);
    };
    WebVideo.prototype.onAdded = function (e) {
        if (!document.getElementsByTagName('video')[0]) {
            var canvasPlayer = document.getElementsByTagName('canvas')[0];
            canvasPlayer.parentElement.insertBefore(this.video, canvasPlayer);
        }
        this.onResize(null);
        this.stage.addEventListener(egret.Event.RESIZE, this.onResize, this);
    };
    WebVideo.prototype.onRemoved = function (e) {
        if (this.video && this.video.parentElement != null) {
            this.video.parentElement.removeChild(this.video);
        }
    };
    /**
     * @private
     *
     */
    WebVideo.prototype.onVideoEnded = function () {
        this.pause();
        this.isPlayed = false;
        if (this._loop) {
            this.play(0, this._loop);
        }
        this.$invalidateContentBounds();
        this.dispatchEventWith(egret.Event.ENDED);
    };
    /**
     * @private
     *
     */
    WebVideo.prototype.onVideoError = function () {
        console.error("video errorCode:", this.video.error.code);
        this.dispatchEventWith(egret.IOErrorEvent.IO_ERROR);
    };
    /**
     * @inheritDoc
     */
    WebVideo.prototype.close = function () {
        var _this = this;
        this.closed = true;
        this.video.removeEventListener("canplay", this.onVideoLoaded);
        this.video.removeEventListener("error", function () { return _this.onVideoError(); });
        this.video.removeEventListener("ended", function () { return _this.onVideoEnded(); });
        this.pause();
        if (this.loaded == false && this.video)
            this.video.src = "";
        if (this.video && this.video.parentElement) {
            this.video.parentElement.removeChild(this.video);
            this.video = null;
        }
        this.loaded = false;
    };
    /**
     * @inheritDoc
     */
    WebVideo.prototype.pause = function () {
        this.userPlay = false;
        if (this.waiting) {
            this.userPause = true;
            return;
        }
        this.userPause = false;
        this.video.pause();
        egret.stopTick(this.markDirty, this);
        this.$invalidate();
    };
    Object.defineProperty(WebVideo.prototype, "loop", {
        get: function () {
            return this._loop;
        },
        set: function (value) {
            if (this.loop !== value)
                this._loop = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebVideo.prototype, "volume", {
        /**
         * @inheritDoc
         */
        get: function () {
            if (!this.video)
                return 1;
            return this.video.volume;
        },
        /**
         * @inheritDoc
         */
        set: function (value) {
            if (!this.video)
                return;
            this.video.volume = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebVideo.prototype, "position", {
        /**
         * @inheritDoc
         */
        get: function () {
            if (!this.video)
                return 0;
            return this.video.currentTime;
        },
        /**
         * @inheritDoc
         */
        set: function (value) {
            if (!this.video)
                return;
            this.video.currentTime = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebVideo.prototype, "fullscreen", {
        /**
         * @inheritDoc
         */
        get: function () {
            return this._fullscreen;
        },
        set: function (value) {
            this._fullscreen = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebVideo.prototype, "bitmapData", {
        /**
         * @inheritDoc
         */
        get: function () {
            if (!this.video || !this.loaded)
                return null;
            if (!this._bitmapData) {
                this.video.width = this.video.videoWidth;
                this.video.height = this.video.videoHeight;
                this._bitmapData = new egret.BitmapData(this.video);
                this._bitmapData.$deleteSource = false;
            }
            return this._bitmapData;
        },
        enumerable: true,
        configurable: true
    });
    WebVideo.prototype.loadPoster = function () {
        var _this = this;
        var poster = this.poster;
        if (!poster)
            return;
        var imageLoader = new egret.ImageLoader();
        imageLoader.once(egret.Event.COMPLETE, function (e) {
            var posterData = imageLoader.data;
            _this.posterData = imageLoader.data;
            _this.posterData.width = _this.getPlayWidth();
            _this.posterData.height = _this.getPlayHeight();
            _this.$invalidateContentBounds();
        }, this);
        imageLoader.load(poster);
    };
    /**
     * @private
     */
    WebVideo.prototype.$measureContentBounds = function (bounds) {
        var bitmapData = this.bitmapData;
        var posterData = this.posterData;
        if (bitmapData) {
            bounds.setTo(0, 0, this.getPlayWidth(), this.getPlayHeight());
        }
        else if (posterData) {
            bounds.setTo(0, 0, this.getPlayWidth(), this.getPlayHeight());
        }
        else {
            bounds.setEmpty();
        }
    };
    WebVideo.prototype.getPlayWidth = function () {
        if (!isNaN(this.widthSet)) {
            return this.widthSet;
        }
        if (this.bitmapData) {
            return this.bitmapData.width;
        }
        if (this.posterData) {
            return this.posterData.width;
        }
        return NaN;
    };
    WebVideo.prototype.getPlayHeight = function () {
        if (!isNaN(this.heightSet)) {
            return this.heightSet;
        }
        if (this.bitmapData) {
            return this.bitmapData.height;
        }
        if (this.posterData) {
            return this.posterData.height;
        }
        return NaN;
    };
    /**
     * @private
     */
    WebVideo.prototype.$render = function () {
        var node = this.$renderNode;
        var bitmapData = this.bitmapData;
        var posterData = this.posterData;
        var width = this.getPlayWidth();
        var height = this.getPlayHeight();
        if (!this.isPlayed && posterData) {
            node.image = posterData;
            node.imageWidth = width;
            node.imageHeight = height;
            node.drawImage(0, 0, posterData.width, posterData.height, 0, 0, width, height);
        }
        else if (this.isPlayed && bitmapData) {
            node.image = bitmapData;
            node.imageWidth = bitmapData.width;
            node.imageHeight = bitmapData.height;
            node.drawImage(0, 0, bitmapData.width, bitmapData.height, 0, 0, width, height);
        }
    };
    WebVideo.prototype.markDirty = function () {
        this.$invalidate();
        return true;
    };
    /**
   * @private
   * 设置显示高度
   */
    WebVideo.prototype.$setHeight = function (value) {
        this.heightSet = +value || 0;
        this.$invalidate();
        this.$invalidateContentBounds();
        return _super.prototype.$setHeight.call(this, value);
    };
    /**
     * @private
     * 设置显示宽度
     */
    WebVideo.prototype.$setWidth = function (value) {
        this.widthSet = +value || 0;
        this.$invalidate();
        this.$invalidateContentBounds();
        return _super.prototype.$setWidth.call(this, value);
    };
    Object.defineProperty(WebVideo.prototype, "paused", {
        get: function () {
            if (this.video) {
                return this.video.paused;
            }
            return true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebVideo.prototype, "length", {
        /**
         * @inheritDoc
         */
        get: function () {
            if (this.video) {
                return this.video.duration;
            }
            throw new Error("Video not loaded!");
        },
        enumerable: true,
        configurable: true
    });
    WebVideo.prototype.onResize = function (e) {
        if (!this.video) {
            egret.error("Video not loaded!");
        }
        var egretPlayer = document.getElementsByTagName('canvas')[0];
        var w = egretPlayer.style.width;
        var h = egretPlayer.style.height;
        console.log('w ', parseInt(w));
        var nw = Math.floor(parseInt(w) * this.scale);
        var nh = Math.floor(parseInt(h) * this.scale);
        var left = egretPlayer.style.left;
        var top = egretPlayer.style.top;
        var transform = egretPlayer.style.transform;
        this.video.style.width = nw + 'px';
        this.video.style.height = nh + 'px';
        this.video.style.left = left;
        this.video.style.top = top;
        this.video.style.transform = transform;
    };
    return WebVideo;
}(egret.DisplayObject));
__reflect(WebVideo.prototype, "WebVideo", ["egret.Video"]);
