/**
 * 视频播放器
 * @author xsstomy
 * @weixin: xsstomy1990
 */
class WebVideo extends egret.DisplayObject implements egret.Video {
    /**
           * @inheritDoc
           */
    public src: string;
    /**
     * @inheritDoc
     */
    public poster: string;

    /**
     * @private
     */
    private posterData: egret.BitmapData;
    /**
     * @private
     */
    private video: HTMLVideoElement;
    /**
     * @private
     */
    private loaded: boolean = false;
    /**
     * @private
     */
    private closed: boolean = false;
    /**
     * @private
     */
    private heightSet: number = NaN;
    /**
     * @private
     */
    private widthSet: number = NaN;
    /**
     * @private
     * pc上视频卡住的时候不能暂停
     */
    private waiting: boolean = false;
    /**
     * @private
     * 用户是否设置了 pause
     */
    private userPause: boolean = false;
    /**
     * @private
     * 用户是否设置了 play
     */
    private userPlay: boolean = false;

    /**
     * 初次加载自动播放
     */
    private autoplay: boolean = false;

    /**
     * 循环播放
     */
    private _loop: boolean = false;

    /**
     * @inheritDoc
     */
    constructor(url?: string, autoplay: boolean = false) {
        super();
        this.$renderNode = new egret['sys'].BitmapNode();
        this.src = url;
        this.autoplay = autoplay;
        this.once(egret.Event.ADDED_TO_STAGE, this.loadPoster, this);
        // this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAdded, this);
        // this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onRemoved, this);
        if (url) {
            this.load();
        }
    }

    /**
     * @inheritDoc
     */
    public load(url?: string, cache: boolean = true) {
        url = url || this.src;
        this.src = url;
        if (DEBUG && !url) {
            egret.$error(3002);
        }
        if (this.video && this.video.src == url && cache) {
            return;
        }
        let video: HTMLVideoElement;
        if (!this.video) {
            video = document.createElement("video");
            this.video = video;
            video.controls = null;
        } else {
            video = this.video;
        }
        video.src = url;
        video.setAttribute("webkit-playsinline", "true");
        video.setAttribute("playsinline", "true");
        video.setAttribute("x5-playsinline", "true");
        video.setAttribute("preload", "none");
        video.setAttribute("id", "egretWebVideo");
        video.addEventListener("canplay", this.onVideoLoaded);
        video.addEventListener("error", () => this.onVideoError());
        video.addEventListener("ended", () => this.onVideoEnded());
        var firstPause = false;
        video.addEventListener("canplay", () => {
            this.waiting = false;
            if (!firstPause) {
                firstPause = true;
                video.pause();
            } else {
                if (this.userPause) {
                    this.pause();
                } else if (this.userPlay) {
                    this.play();
                }
            }

        });
        video.addEventListener("waiting", () => {
            this.waiting = true;
        });

        video.load();
        video.style.overflow = "hidden";
        video.style.transformOrigin = "0 0 0";
        video.style.position = "absolute";
        video.style.zIndex = "-88888";
        video.width = 1;
        video.height = 1;
    }

    private isPlayed: boolean = false;

    /**
     * @inheritDoc
     */
    public play(startTime?: number, loop: boolean = false) {
        if (this.loaded == false) {
            this.load(this.src);
            this.once(egret.Event.COMPLETE, e => this.play(startTime, loop), this);
            return;
        }

        if (loop) {
            this._loop = true;
        }
        this.isPlayed = true;

        let video = this.video;
        if (startTime != undefined) {
            video.currentTime = +startTime || 0;
        }
        video.loop = !!loop;
        video.height = video.videoHeight;
        video.width = video.videoWidth;
        this.videoPlay();
    }

    private videoPlay() {
        this.userPause = false;
        if (this.waiting) {
            this.userPlay = true;
            return
        }
        this.userPlay = false;
        this.video.play();
        egret.startTick(this.markDirty, this);
    }

    private onAdded(e: egret.Event) {
        if (!document.getElementsByTagName('video')[0]) {
            let canvasPlayer = document.getElementsByTagName('canvas')[0];
            canvasPlayer.parentElement.insertBefore(this.video, canvasPlayer);
        }
        this.onResize(null)
        this.stage.addEventListener(egret.Event.RESIZE, this.onResize, this);
    }

    private onRemoved(e: egret.Event) {
        if (this.video && this.video.parentElement != null) {
            this.video.parentElement.removeChild(this.video);
        }
    }

    /**
     * @private
     *
     */
    private onVideoEnded() {
        this.pause();
        this.isPlayed = false;
        if (this._loop) {
            this.play(0, this._loop);
        }
        this.$invalidateContentBounds();
        this.dispatchEventWith(egret.Event.ENDED);
    }

    /**
     * @private
     *
     */
    private onVideoError() {
        console.error("video errorCode:", this.video.error.code);
        this.dispatchEventWith(egret.IOErrorEvent.IO_ERROR);
    }

    /**
     * @inheritDoc
     */
    public close() {
        this.closed = true;
        this.video.removeEventListener("canplay", this.onVideoLoaded);
        this.video.removeEventListener("error", () => this.onVideoError());
        this.video.removeEventListener("ended", () => this.onVideoEnded());
        this.pause();
        if (this.loaded == false && this.video)
            this.video.src = "";
        if (this.video && this.video.parentElement) {
            this.video.parentElement.removeChild(this.video);
            this.video = null;
        }
        this.loaded = false;
    }


    /**
     * @inheritDoc
     */
    public pause() {
        this.userPlay = false;
        if (this.waiting) {
            this.userPause = true;
            return
        }
        this.userPause = false;
        this.video.pause();
        egret.stopTick(this.markDirty, this);
        this.$invalidate();
    }

    public get loop(): boolean {
        return this._loop;
    }

    public set loop(value) {
        if (this.loop !== value)
            this._loop = value;
    }


    /**
     * @inheritDoc
     */
    public get volume(): number {
        if (!this.video)
            return 1;
        return this.video.volume;
    }

    /**
     * @inheritDoc
     */
    public set volume(value: number) {
        if (!this.video)
            return;
        this.video.volume = value;
    }

    /**
     * @inheritDoc
     */
    public get position(): number {
        if (!this.video)
            return 0;
        return this.video.currentTime;
    }

    private _fullscreen = false;
    /**
     * @inheritDoc
     */
    public get fullscreen(): boolean {
        return this._fullscreen;
    }

    public set fullscreen(value) {
        this._fullscreen = value;
    }

    /**
     * @inheritDoc
     */
    public set position(value: number) {
        if (!this.video)
            return;
        this.video.currentTime = value;
    }

    private _bitmapData: egret.BitmapData;

    /**
     * @inheritDoc
     */
    public get bitmapData(): egret.BitmapData {
        if (!this.video || !this.loaded)
            return null;
        if (!this._bitmapData) {
            this.video.width = this.video.videoWidth;
            this.video.height = this.video.videoHeight;
            this._bitmapData = new egret.BitmapData(this.video);
            this._bitmapData.$deleteSource = false;
        }
        return this._bitmapData;
    }

    private loadPoster() {
        let poster = this.poster;
        if (!poster)
            return;
        let imageLoader = new egret.ImageLoader();
        imageLoader.once(egret.Event.COMPLETE, e => {
            let posterData = <HTMLImageElement><any>imageLoader.data;
            this.posterData = imageLoader.data;
            this.posterData.width = this.getPlayWidth();
            this.posterData.height = this.getPlayHeight();
            this.$invalidateContentBounds();
        }, this);
        imageLoader.load(poster);
    }

    /**
     * @private
     *
     */
    private onVideoLoaded = () => {
        this.video.removeEventListener("canplay", this.onVideoLoaded);
        let video = this.video;
        this.loaded = true;
        //video.pause();
        if (this.posterData) {
            this.posterData.width = this.getPlayWidth();
            this.posterData.height = this.getPlayHeight();
        }
        video.width = video.videoWidth;
        video.height = video.videoHeight;

        if (this.autoplay) {
            this.play();
            this.autoplay = false;
        }

        this.$invalidateContentBounds();
        window.setTimeout(() => {
            this.dispatchEventWith(egret.Event.COMPLETE);
        }, 200);
    };

    /**
     * @private
     */
    $measureContentBounds(bounds: egret.Rectangle): void {
        let bitmapData = this.bitmapData;
        let posterData = this.posterData;
        if (bitmapData) {
            bounds.setTo(0, 0, this.getPlayWidth(), this.getPlayHeight());
        }
        else if (posterData) {
            bounds.setTo(0, 0, this.getPlayWidth(), this.getPlayHeight());
        }
        else {
            bounds.setEmpty();
        }
    }

    private getPlayWidth(): number {
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
    }

    private getPlayHeight(): number {
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
    }

    /**
     * @private
     */
    $render(): void {
        let node = <egret.sys.BitmapNode>this.$renderNode;
        let bitmapData = this.bitmapData;
        let posterData = this.posterData;
        let width = this.getPlayWidth();
        let height = this.getPlayHeight();
        if (!this.isPlayed && posterData) {
            node.image = posterData;
            node.imageWidth = width;
            node.imageHeight = height;
            node.drawImage(0, 0, posterData.width, posterData.height, 0, 0, width, height);
        } else if (this.isPlayed && bitmapData) {
            node.image = bitmapData;
            node.imageWidth = bitmapData.width;
            node.imageHeight = bitmapData.height;
            node.drawImage(0, 0, bitmapData.width, bitmapData.height, 0, 0, width, height);
        }

    }

    private markDirty(): boolean {
        this.$invalidate();
        return true;
    }

    /**
   * @private
   * 设置显示高度
   */
    $setHeight(value: number): boolean {
        this.heightSet = +value || 0;
        this.$invalidate();
        this.$invalidateContentBounds();
        return super.$setHeight(value);
    }

    /**
     * @private
     * 设置显示宽度
     */
    $setWidth(value: number): boolean {
        this.widthSet = +value || 0;
        this.$invalidate();
        this.$invalidateContentBounds();
        return super.$setWidth(value);
    }

    public get paused(): boolean {
        if (this.video) {
            return this.video.paused;
        }
        return true;
    }
    /**
     * @inheritDoc
     */
    public get length(): number {
        if (this.video) {
            return this.video.duration;
        }
        throw new Error("Video not loaded!");
    }


    //====================================

    public scale = 1;

    private onResize(e: egret.Event) {
        if (!this.video) {
            egret.error("Video not loaded!");
        }
        let egretPlayer = document.getElementsByTagName('canvas')[0];
        let w = egretPlayer.style.width;
        let h = egretPlayer.style.height;
        console.log('w ', parseInt(w));
        let nw = Math.floor(parseInt(w) * this.scale);
        let nh = Math.floor(parseInt(h) * this.scale);
        let left = egretPlayer.style.left;
        let top = egretPlayer.style.top;
        let transform = egretPlayer.style.transform;
        this.video.style.width = nw + 'px';
        this.video.style.height = nh + 'px';
        this.video.style.left = left;
        this.video.style.top = top;
        this.video.style.transform = transform;
    }
}
