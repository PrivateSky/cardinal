import {Component, h, Prop, Element} from '@stencil/core';
import CustomTheme from "../../../decorators/CustomTheme";
import {BindModel} from '../../../decorators/BindModel';
import audioData from './audioData.js';
import {stringToBoolean} from "../../../utils/utilFunctions";
import BarcodeUtilFunctions from "./barcode-util-functions.js";
import VideoOverlay  from "./VideoOverlay.js";
import ImageOverlay  from "./ImageOverlay.js";
import {TableOfContentProperty} from "../../../decorators/TableOfContentProperty";
const SCAN_TIMEOUT = 100;

@Component({
  tag: 'psk-barcode-scanner'
})
export class PskBarcodeScanner {

  @BindModel() modelHandler;
  @CustomTheme()
  @Element() element;
  @TableOfContentProperty({
    description: `The data-model that will be updated with the retrieved data from the scanner.`,
    isMandatory: true,
    propertyType: `string`
  })
  @Prop() data:any;
  @TableOfContentProperty({
    description: `A title that will be used for the current component instance.`,
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() title: string = "";
  @TableOfContentProperty({
    description: `A boolean value indicating that the current component instance is accepting files from the device. Please note that if no camera is detected, this feature will be automatically enabled.`,
    isMandatory: false,
    propertyType: `boolean`
  })
  @Prop() allowFileBrowsing:boolean = false;

  // force camera to not be stretched (PC DIMENSIONS)
  @Prop() normalSize: boolean = false;

  private componentIsDisconnected = false;
  private ZXing = null;
  private decodePtr = null;
  private videoElement = null;
  private cameraIsAvailable = false;
  private cameraIsOn = false;
  private overlay = null;


  stopTracks(){
    if (window['stream']) {
      window['stream'].getTracks().forEach(function(track) {
        track.stop();
      });
      this.cameraIsOn = false;
    }
  }

  handleCameraError  = (error) =>{
    console.log('Error: ', error);
    this.cameraIsAvailable = false;
    this.stopCameraUsage();
  }

  changeCamera = () =>{
    this.stopTracks()
    this.getStream();
  }

  cleanupOverlays(){
    if(this.overlay){
      this.overlay.removeOverlays();
    }
  }

  /**
   * stop camera and prepare the view for enabling it again
   */
  stopCameraUsage() {
    let scannerContainer = this.element.querySelector("#scanner_container");
    let useCameraBtn = this.element.querySelector("#use-camera-btn");

    if (useCameraBtn) {
      if (this.cameraIsAvailable) {
        this.stopTracks();
        useCameraBtn.style.display = "block";
      } else {
        useCameraBtn.style.display = "none";
      }
    }

    this.element.querySelector("#video").style.display = "none";
    this.element.querySelector("#camera-source").style.display = "none";
    let videoSelectOptions = this.element.querySelector('select#videoSource');
    videoSelectOptions.options.length = 0;
    videoSelectOptions.removeEventListener("change", this.changeCamera);

    this.cleanupOverlays();
    this.overlay = new ImageOverlay(scannerContainer);
    this.overlay.createOverlaysCanvases("imageCanvas");
  }

  /**
   * start camera and prepare the view for overlaying the video stream
   */
  startCameraUsage(){
    let useCameraBtn = this.element.querySelector("#use-camera-btn");
    if(useCameraBtn){
      useCameraBtn.style.display="none";
    }
    this.element.querySelector("#video").style.display="block";
    this.element.querySelector("#camera-source").style.display="block";

    let scannerContainer = this.element.querySelector("#scanner_container");
    this.cleanupOverlays();
    this.startCameraScan();
    this.overlay = new VideoOverlay(scannerContainer, this.videoElement, this.normalSize);
    this.overlay.createOverlaysCanvases("lensCanvas", "overlayCanvas");
    this.overlay.drawLensCanvas();
  }

  removeDeviceIdFromList(deviceId) {
    let camerasSelectList = this.element.querySelector('select#videoSource');
    for (let i = 0; i < camerasSelectList.length; i++) {
      if (camerasSelectList.options[i].value === deviceId) {
        camerasSelectList.remove(i);
        //select nextElement if available
        if(camerasSelectList.length){
          camerasSelectList.selectedIndex = i;
        }
        else{
          camerasSelectList.selectedIndex = -1;
        }
        break;
      }
    }
  }

  /**
   * select the stream and get barcode from the stream
   */
  getStream = () => {
    let camerasSelectList = this.element.querySelector('select#videoSource');
    let alternativeCameras = Array.from(camerasSelectList.querySelectorAll("option")).map((option: any) => {
      return option.value;
    }).filter((cameraId) => {
      return cameraId !== camerasSelectList.value
    });

    let constraints = {
      audio: false
    };

    if (camerasSelectList.value) {
      constraints['video'] = {
        deviceId: {exact: camerasSelectList.value}
      }
    } else {
      constraints['video'] = true
    }

    let gotStream = (stream) => {
      window['stream'] = stream; // make stream available to console
      this.cameraIsOn = true;
      this.videoElement.srcObject = stream;
      this.scanBarcodeFromCamera();
    }

    let startVideo = (constraints) => {
      navigator.mediaDevices.getUserMedia(constraints).then(gotStream.bind(this)).catch((err) => {
        if (err.message === "Could not start video source") {
          if (alternativeCameras.length) {
            this.removeDeviceIdFromList(constraints['video'].deviceId.exact);
            constraints.video.deviceId = {exact: alternativeCameras.shift()};
            startVideo(constraints);
          }
        } else {
          this.handleCameraError(err)
        }
      });
    }

    startVideo(constraints);
  }


  /**
   * attempt to start camera and get the stream
   */
  startCameraScan() {
    this.videoElement = this.element.querySelector('video');
    let videoSelect = this.element.querySelector('select#videoSource');

    let gotDevices = (deviceInfos) => {
      if (deviceInfos.length) {
        for (let i = deviceInfos.length - 1; i >= 0; --i) {
          let deviceInfo = deviceInfos[i];
          let option = document.createElement('option');
          option.value = deviceInfo.deviceId;
          if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || 'camera ' +
              (videoSelect.length + 1);
            videoSelect.appendChild(option);
          }
        }

      } else {
        this.stopCameraUsage();
      }
    }

    navigator.mediaDevices.enumerateDevices()
      .then(gotDevices).then(this.getStream).catch(this.handleCameraError);
    videoSelect.addEventListener("change",this.changeCamera.bind(this));
  }


  /**
   * ZXing library initialization
   * @param successCallback will be called when the library is ready to accept decoding tasks
   * @param resultCallback will be called when decoding tasks has positive results
   */
  private initializeZXing(successCallback, resultCallback) {
    let tick = () => {
      if (window['ZXing']) {
        this.ZXing = window['ZXing']();
        this.decodePtr = this.ZXing.Runtime.addFunction(decodeCallback);
        setTimeout(successCallback, SCAN_TIMEOUT);
      } else {
        setTimeout(tick, SCAN_TIMEOUT);
      }
    };

    setTimeout(tick, SCAN_TIMEOUT);
    //@ts-ignore
    let decodeCallback = (ptr, len, resultIndex, resultCount, x1, y1, x2, y2, x3, y3, x4, y4) => {
      let result = new Uint8Array(this.ZXing.HEAPU8.buffer, ptr, len);

      let stringResult = "";
      let separatorIndex = 0;
      let separatorStarted = false;
      for (let i = 0; i < result.length; i++) {
        //29 -  group separator char code
        if (result[i] == 29) {
          stringResult += "(";
          separatorStarted = true;
          separatorIndex = 0;
        } else {
          stringResult += String.fromCharCode(result[i]);
          if (separatorStarted) {
            separatorIndex++;
            if (separatorIndex == 2) {
              stringResult += ")";
              separatorStarted = false;
            }
          }
        }
      }

      resultCallback({points:{x1, y1, x2, y2, x3, y3, x4, y4}, data:stringResult})

    };
  }

  /**
   * this function is taking an uploaded image from the device and sending it to the decoder
   * @param event
   */
  private scanBarcodeFromUploadedFile(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    this.stopCameraUsage();

    if (!event.data || !event.data.length) {
      return;
    }
    let file = event.data[0];

    let reader = new FileReader();
    // load to image to get it's width/height
    let img = new Image();
    img.onload = () => {
      let ctx = this.overlay.getImageCanvasContext();
      // scale canvas to image
      let scaled = BarcodeUtilFunctions.getScaledDim(img, 640, 480);
      ctx.canvas.width = scaled.width;
      ctx.canvas.height = scaled.height;
      // draw image
      ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
      let imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      let idd = imageData.data;
      let image = this.ZXing._resize(ctx.canvas.width, ctx.canvas.height);
      this.decodeImage(image, idd, () => {
        this.overlay.drawUnmatch("No code was matched!")
      });
    }
    // this is to setup loading the image
    reader.onloadend = function () {
      //@ts-ignore
      img.src = reader.result;
    }
    // this is to read the file
    reader.readAsDataURL(file);
  }


  /**
   * this function is taking a snapshot from the video and sending a task to the decoder
   */
  scanBarcodeFromCamera() {
    // let vid = this.element.querySelector("#video");
    let barcodeCanvas = document.createElement("canvas");
    //[x,y, width, height]
    let crpOpt = this.overlay.getCropOptions();
    barcodeCanvas.width = crpOpt[2];
    barcodeCanvas.height = crpOpt[3];
    let barcodeContext = barcodeCanvas.getContext('2d');
    //let imageWidth = vid['videoWidth'], imageHeight = vid['videoHeight'];

    //barcodeContext.drawImage(this.videoElement, 0, 0, imageWidth, imageHeight);
    barcodeContext.drawImage(this.videoElement, crpOpt[0],crpOpt[1],crpOpt[2],crpOpt[3],0,0,crpOpt[2],crpOpt[3]);
    // read barcode
    //let imageData = barcodeContext.getImageData(0, 0, imageWidth, imageHeight);
    let imageData = barcodeContext.getImageData(0,0,crpOpt[2],crpOpt[3]);
    let idd = imageData.data;
    let image = this.ZXing._resize(crpOpt[2], crpOpt[3]);
    this.decodeImage(image, idd,()=>{
      if (!this.componentIsDisconnected) {
        setTimeout(()=>{
          if(this.cameraIsOn){
            this.scanBarcodeFromCamera();
          }
        }, SCAN_TIMEOUT);
      }
    });
  }


  private decodeImage(image, idd: Uint8ClampedArray, callback) {
    for (let i = 0, j = 0; i < idd.length; i += 4, j++) {
      this.ZXing.HEAPU8[image + j] = idd[i];
    }
    let err = this.ZXing._decode_any(this.decodePtr);
    if (err === -2) {
      if (typeof callback === "function") {
        callback();
      }
    }
  }

  /**
   * COMPONENT LIFECYCLE  METHODS
   */

  /**
   * check if any camera is available before first render
   */
  componentWillLoad():Promise<any>{
    function detectWebcam(callback) {
      let md = navigator.mediaDevices;
      if (!md || !md.enumerateDevices) return callback(false);
      md.enumerateDevices().then(devices => {
        callback(devices.some(device => 'videoinput' === device.kind));
      })
    }

    return new Promise((resolve => {
      detectWebcam((hasCamera) => {
        this.cameraIsAvailable = hasCamera;
        resolve();
      })
    }))
  }

  /**
   * after first render occurred, add the buttons events listeners if needed and initialize the ZXing library
   */
  componentDidLoad(){
    if(this.componentIsDisconnected){
      return;
    }

    if (this.cameraIsAvailable === false) {
      this.element.addEventListener("loaded-local-file", this.scanBarcodeFromUploadedFile.bind(this));
    } else {
      if (stringToBoolean(this.allowFileBrowsing)) {
        this.element.addEventListener("loaded-local-file", this.scanBarcodeFromUploadedFile.bind(this));
        this.element.addEventListener("use-camera", this.startCameraUsage.bind(this));
      }
    }

    this.initializeZXing( this.startCameraUsage.bind(this),(result)=>{
      this.modelHandler.updateModel('data', result.data);
      audioData.play();
      this.overlay.drawOverlay(result.points);
      if (!this.componentIsDisconnected) {
        setTimeout(()=>{
          if(this.cameraIsOn){
            this.scanBarcodeFromCamera();
          }
        }, 1000);
      }
    });
  }

  disconnectedCallback(){
    this.componentIsDisconnected = true;
    this.stopTracks();
  }

  render() {
    if(this.componentIsDisconnected){
      return  null;
    }
    let fileBrowsingIsAllowed = stringToBoolean(this.allowFileBrowsing);

    const layout = {
      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center',
      padding: '1em', margin: '0.25em 0'
    };

    return (
      [
        <script async src="/cardinal/libs/zxing.js"/>,
        <div title={this.title}>
          { this.cameraIsAvailable === false
            ? (
              <psk-highlight title="No camera detected" type-of-highlight="warning">
                <p>You can still use your device files to check for barcodes!</p>
              </psk-highlight>
            )
            : [
              <div style={{position: "relative"}} id="scanner_container">
                <video muted autoplay id="video" playsinline={true} style={{width: "100%"}}/>
              </div>,
              <div style={layout}>
                <label htmlFor="videoSource" style={{margin: '0'}}>Video source</label>
                <div class="select" id="camera-source">
                  <select id="videoSource" style={{background: 'transparent', padding: '5px', border: '0'}} />
                </div>
              </div>
            ]
          }
          { fileBrowsingIsAllowed || this.cameraIsAvailable === false
            ? [
              <psk-files-chooser accept="image/*" label="Load a file from device" event-name="loaded-local-file"/>,
              <psk-button event-name="use-camera" label="Use camera" style={{display: "none"}} id="use-camera-btn"/>
            ]
            : null
          }
        </div>
      ]
    );
  }
}

