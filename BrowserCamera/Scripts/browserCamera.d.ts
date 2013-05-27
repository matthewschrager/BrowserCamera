interface Camera
{
    Start(callback: () => void , videoElementId?: string);
    Stop();

    TakeSnapshot(callback: (dataUrl: string) => void , canvasElementId?: string);
    DataUrlToRawData(dataUrl: string);
    PostImageData(url: string, paramName: string, dataUrl: string, callback: (response) => void );
    PostSnapshot(url: string, paramName: string, callback: (response) => void );
}

interface CameraStatic
{
    Create(): Camera;
    DataUrlToRawData(dataUrl: string): string;
}

declare var BrowserCam: CameraStatic;