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
        this.Video = <HTMLVideoElement>document.createElement("video");
        this.Video.autoplay = true;
        this.Video.setAttribute("style", "display: none");

        this.Canvas = <HTMLCanvasElement>document.createElement("canvas");
        this.Canvas.setAttribute("style", "display: none");

        document.getElementsByTagName("html")[0].appendChild(this.Video);
        document.getElementsByTagName("html")[0].appendChild(this.Canvas);

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
    private Canvas: HTMLCanvasElement;
    private LocalMediaStream: any;
    private CreateObjectURL: (stream: any) => string;
    private GetUserMedia: () => Navigator;

    public Initialize(callback: () => void )
    {
        navigator.getUserMedia({ video: true }, (stream) => {
            this.LocalMediaStream = stream
            callback();
        },
        (e) => {
            throw "Could not acquire device. Error: " + e;
        });
    }

    public Shutdown()
    {
        this.Video.pause();
        this.LocalMediaStream.stop();

        if (this.Video['mozSrcObject'])
            this.Video['mozSrcObject'] = null;
        else if (window['webkitURL'])
            this.Video.src = "";
        else
            this.Video.src = null;
    }

    public TakeSnapshot(callback: (data: string) => void )
    {
        if (!this.LocalMediaStream)
            return;

        this.Video.src = this.CreateObjectURL(this.LocalMediaStream);
        setTimeout(() => {
            this.Canvas.getContext('2d').drawImage(this.Video, 0, 0);
            var imgData = this.Canvas.toDataURL("image/png");
            callback(imgData);
        }, 50);
    }

    public PostSnapshot(url: string, paramName: string, callback: (response) => void )
    {
        this.TakeSnapshot((imgData: string) => {
            var rawData = imgData.replace('data:image/png;base64,', '');
            var jsonData = '{ "' + paramName + '": "' + rawData + '" }';

            $.ajax({
                url: url,
                type: "POST",
                data: jsonData,
                contentType: "application/json",
            }).done((response) => callback(response));
        });
    }
}