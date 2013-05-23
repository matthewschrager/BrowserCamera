interface Camera
{
    Start(callback: () => void , videoElementId?: string);
    Stop();

    TakeSnapshot(callback: (dataUrl: string) => void , canvasElementId?: string);
    PostImageData(url: string, paramName: string, imageData: string, callback: (response) => void );
    PostSnapshot(url: string, paramName: string, callback: (response) => void );
}

interface CameraStatic
{
    Create(): Camera;
}

declare var BrowserCam: CameraStatic;