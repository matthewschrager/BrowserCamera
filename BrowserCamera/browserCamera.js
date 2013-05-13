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
    Camera.prototype.Start = function (callback, videoElement) {
        if (typeof videoElement === "undefined") { videoElement = null; }
        var _this = this;
        this.InitializeVideo(videoElement);
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
    Camera.prototype.TakeSnapshot = function (callback, canvasElement) {
        if (typeof canvasElement === "undefined") { canvasElement = null; }
        var _this = this;
        if(!this.Video) {
            throw "The camera must be started to take a snapshot. Call Start() before TakeSnapshot().";
        }
        this.InitializeCanvas(canvasElement);
        setTimeout(function () {
            _this.Canvas.getContext('2d').drawImage(_this.Video, 0, 0);
            var imgData = _this.Canvas.toDataURL("image/png");
            _this.ReleaseCanvas();
            if(callback) {
                callback(imgData);
            }
        }, 50);
    };
    Camera.prototype.PostSnapshot = function (url, paramName, callback) {
        this.TakeSnapshot(function (imgData) {
            var rawData = imgData.replace('data:image/png;base64,', '');
            var jsonData = '{ "' + paramName + '": "' + rawData + '" }';
            $.ajax({
                url: url,
                type: "POST",
                data: jsonData,
                contentType: "application/json"
            }).done(function (response) {
                return callback(response);
            });
        });
    };
    return Camera;
})();
