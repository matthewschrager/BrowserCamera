var Camera = (function () {
    function Camera() {
        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
        if(window['URL']) {
            this.CreateObjectURL = window['URL'].createObjectURL;
        } else if(window['webkitURL']) {
            this.CreateObjectURL = window['webkitURL'].createObjectURL;
        } else if(window['mozURL']) {
            this.CreateObjectURL = window['mozURL'].createObjectURL;
        } else {
            throw "No URL object found.";
        }
    }
    Camera.prototype.InitializeVideo = function (element) {
        if (typeof element === "undefined") { element = null; }
        this.Video = element != null ? element : document.createElement("video");
        this.Video.autoplay = true;
        this.OwnsVideoElement = element == null;
        if(this.OwnsVideoElement) {
            this.Video.setAttribute("style", "display: none");
            document.getElementsByTagName("html")[0].appendChild(this.Video);
        }
    };
    Camera.prototype.ReleaseVideo = function () {
        if(this.OwnsVideoElement) {
            this.Video.parentElement.removeChild(this.Video);
        }
        this.Video = null;
        this.OwnsVideoElement = false;
    };
    Camera.prototype.InitializeCanvas = function (element) {
        if (typeof element === "undefined") { element = null; }
        this.Canvas = element != null ? element : document.createElement("canvas");
        this.OwnsCanvasElement = element == null;
        if(this.OwnsCanvasElement) {
            this.Canvas.setAttribute("style", "display: none");
            document.getElementsByTagName("html")[0].appendChild(this.Canvas);
        }
    };
    Camera.prototype.ReleaseCanvas = function () {
        if(this.OwnsCanvasElement) {
            this.Canvas.parentElement.removeChild(this.Canvas);
        }
        this.Canvas = null;
        this.OwnsCanvasElement = false;
    };
    Camera.prototype.Start = function (callback, videoElementId) {
        if (typeof videoElementId === "undefined") { videoElementId = null; }
        var _this = this;
        this.InitializeVideo(document.getElementById(videoElementId));
        navigator.getUserMedia({
            video: true
        }, function (stream) {
            _this.LocalMediaStream = stream;
            _this.Video.src = _this.CreateObjectURL(_this.LocalMediaStream);
            if(callback) {
                callback();
            }
        }, function (e) {
            throw "Could not acquire device. Error: " + e;
        });
    };
    Camera.prototype.Stop = function () {
        if(this.Video) {
            this.Video.pause();
            if(this.Video['mozSrcObject']) {
                this.Video['mozSrcObject'] = null;
            } else if(window['webkitURL']) {
                this.Video.src = "";
            } else {
                this.Video.src = null;
            }
        }
        if(this.LocalMediaStream) {
            this.LocalMediaStream.stop();
        }
        this.ReleaseVideo();
    };
    Camera.prototype.IsStarted = function () {
        return this.Video != null && this.Video != undefined;
    };
    Camera.prototype.TakeSnapshot = function (callback, canvasElementId) {
        if (typeof canvasElementId === "undefined") { canvasElementId = null; }
        var _this = this;
        if(!this.Video) {
            throw "The camera must be started to take a snapshot. Call Start() before TakeSnapshot().";
        }
        this.InitializeCanvas(document.getElementById(canvasElementId));
        setTimeout(function () {
            _this.Canvas.width = _this.Video.videoWidth;
            _this.Canvas.height = _this.Video.videoHeight;
            _this.Canvas.getContext('2d').drawImage(_this.Video, 0, 0);
            var imgData = _this.Canvas.toDataURL("image/png");
            _this.ReleaseCanvas();
            if(callback) {
                callback(imgData);
            }
        }, 50);
    };
    Camera.DataUrlToRawData = function DataUrlToRawData(dataUrl) {
        return dataUrl.replace('data:image/png;base64,', '');
    };
    Camera.prototype.PostImageData = function (url, paramName, dataUrl, callback) {
        var rawData = Camera.DataUrlToRawData(dataUrl);
        var jsonData = '{ "' + paramName + '": "' + rawData + '" }';
        $.ajax({
            url: url,
            type: "POST",
            data: jsonData,
            contentType: "application/json"
        }).done(function (response) {
            return callback(response);
        });
    };
    Camera.prototype.PostSnapshot = function (url, paramName, callback) {
        var _this = this;
        this.TakeSnapshot(function (imgData) {
            return _this.PostImageData(url, paramName, imgData, callback);
        });
    };
    return Camera;
})();
var CameraStatic = (function () {
    function CameraStatic() { }
    CameraStatic.prototype.Create = function () {
        return new Camera();
    };
    CameraStatic.prototype.DataUrlToRawData = function (dataUrl) {
        return Camera.DataUrlToRawData(dataUrl);
    };
    return CameraStatic;
})();
var BrowserCam = new CameraStatic();
