declare var $;

interface Navigator
{
    getUserMedia(
        options: { video?: bool; audio?: bool; },
        success: (stream: any) => void ,
        error?: (error: string) => void
        ): void;

    webkitGetUserMedia(
        options: { video?: bool; audio?: bool; },
        success: (stream: any) => void ,
        error?: (error: string) => void
        ): void;

    mozGetUserMedia(
        options: { video?: bool; audio?: bool; },
        success: (stream: any) => void ,
        error?: (error: string) => void
        ): void;

    msGetUserMedia(
        options: { video?: bool; audio?: bool; },
        success: (stream: any) => void ,
        error?: (error: string) => void
        ): void;
}

class Camera
{
    constructor()
    {
        navigator.getUserMedia = (navigator.getUserMedia ||
                   navigator.webkitGetUserMedia ||
                   navigator.mozGetUserMedia ||
                   navigator.msGetUserMedia);

        if (window['URL'])
            this.CreateObjectURL = window['URL'].createObjectURL;
        else if (window['webkitURL'])
            this.CreateObjectURL = window['webkitURL'].createObjectURL;
        else if (window['mozURL'])
            this.CreateObjectURL = window['mozURL'].createObjectURL;
        else
            throw "No URL object found.";
    }

    private Video: HTMLVideoElement;
    private OwnsVideoElement: bool;

    private Canvas: HTMLCanvasElement;
    private OwnsCanvasElement: bool;

    private LocalMediaStream: any;
    private CreateObjectURL: (stream: any) => string;
    private GetUserMedia: () => Navigator;

    private InitializeVideo(element: HTMLVideoElement = null)
    {
        this.Video = element != null ? element : <HTMLVideoElement>document.createElement("video");
        this.Video.autoplay = true;

        // If we're creating a new DOM element, make it hidden and attach it to the DOM
        this.OwnsVideoElement = element == null;
        if (this.OwnsVideoElement)
        {
            this.Video.setAttribute("style", "display: none");
            document.getElementsByTagName("html")[0].appendChild(this.Video);
        }
    }

    private ReleaseVideo()
    {
        if (this.OwnsVideoElement)
            this.Video.parentElement.removeChild(this.Video);

        this.Video = null;
        this.OwnsVideoElement = false;
    }


    private InitializeCanvas(element: HTMLCanvasElement = null)
    {
        this.Canvas = element != null ? element : <HTMLCanvasElement>document.createElement("canvas");

        // If we're creating a new DOM element, make it hidden and attach it to the DOM
        this.OwnsCanvasElement = element == null;
        if (this.OwnsCanvasElement)
        {
            this.Canvas.setAttribute("style", "display: none");
            document.getElementsByTagName("html")[0].appendChild(this.Canvas);
        }
    }

    private ReleaseCanvas()
    {
        if (this.OwnsCanvasElement)
            this.Canvas.parentElement.removeChild(this.Canvas);

        this.Canvas = null;
        this.OwnsCanvasElement = false;
    }

    public Start(callback: () => void, videoElementId?: string = null)
    {
        this.InitializeVideo(<HTMLVideoElement>document.getElementById(videoElementId));

        navigator.getUserMedia({ video: true }, (stream) => {
            this.LocalMediaStream = stream;
            this.Video.src = this.CreateObjectURL(this.LocalMediaStream);
            
            if (callback)
                callback();
        },
        (e) => {
            throw "Could not acquire device. Error: " + e;
        });
    }

    public Stop()
    {
        if (this.Video)
        {
            this.Video.pause();
            if (this.Video['mozSrcObject'])
                this.Video['mozSrcObject'] = null;
            else if (window['webkitURL'])
                this.Video.src = "";
            else
                this.Video.src = null;
        }

        if (this.LocalMediaStream)
            this.LocalMediaStream.stop();

        this.ReleaseVideo();
    }

    public IsStarted()
    {
        return this.Video != null && this.Video != undefined;
    }

    public TakeSnapshot(callback: (dataUrl: string) => void , canvasElementId?: string = null)
    {
        if (!this.Video)
            throw "The camera must be started to take a snapshot. Call Start() before TakeSnapshot().";

        this.InitializeCanvas(<HTMLCanvasElement>document.getElementById(canvasElementId));
        setTimeout(() => {
            this.Canvas.width = this.Video.videoWidth;
            this.Canvas.height = this.Video.videoHeight;

            this.Canvas.getContext('2d').drawImage(this.Video, 0, 0);
            var imgData = this.Canvas.toDataURL("image/png");
            this.ReleaseCanvas();

            if (callback)
                callback(imgData);
        }, 50);
    }

    public static DataUrlToRawData(dataUrl: string)
    {
        return dataUrl.replace('data:image/png;base64,', '');
    }

    public PostImageData(url: string, paramName: string, dataUrl: string, callback: (response) => void)
    {
        var rawData = Camera.DataUrlToRawData(dataUrl);
        var jsonData = '{ "' + paramName + '": "' + rawData + '" }';

        $.ajax({
            url: url,
            type: "POST",
            data: jsonData,
            contentType: "application/json",
        }).done((response) => callback(response));
    }

    public PostSnapshot(url: string, paramName: string, callback: (response) => void )
    {
        this.TakeSnapshot((imgData: string) => this.PostImageData(url, paramName, imgData, callback));
    }
}

class CameraStatic
{
    public Create()
    {
        return new Camera();
    }

    public DataUrlToRawData(dataUrl: string)
    {
        return Camera.DataUrlToRawData(dataUrl);
    }
}

var BrowserCam = new CameraStatic();