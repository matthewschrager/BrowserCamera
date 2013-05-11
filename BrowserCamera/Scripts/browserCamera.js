var Camera = (function () {
    function Camera() {
        this.Video = document.createElement("video");
        this.Video.autoplay = true;
        this.Video.setAttribute("style", "display: none");
        this.Canvas = document.createElement("canvas");
        this.Canvas.setAttribute("style", "display: none");
        document.getElementsByTagName("html")[0].appendChild(this.Video);
        document.getElementsByTagName("html")[0].appendChild(this.Canvas);
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
    Camera.prototype.Initialize = function (callback) {
        var _this = this;
        navigator.getUserMedia({
            video: true
        }, function (stream) {
            _this.LocalMediaStream = stream;
            callback();
        }, function (e) {
            throw "Could not acquire device. Error: " + e;
        });
    };
    Camera.prototype.Shutdown = function () {
        this.Video.pause();
        this.LocalMediaStream.stop();
        if(this.Video['mozSrcObject']) {
            this.Video['mozSrcObject'] = null;
        } else if(window['webkitURL']) {
            this.Video.src = "";
        } else {
            this.Video.src = null;
        }
    };
    Camera.prototype.TakeSnapshot = function (callback) {
        var _this = this;
        if(!this.LocalMediaStream) {
            return;
        }
        this.Video.src = this.CreateObjectURL(this.LocalMediaStream);
        setTimeout(function () {
            _this.Canvas.getContext('2d').drawImage(_this.Video, 0, 0);
            var imgData = _this.Canvas.toDataURL("image/png");
            callback(imgData);
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
