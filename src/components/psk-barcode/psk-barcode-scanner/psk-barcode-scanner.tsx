import { Component, Prop, Element, h } from '@stencil/core';

import CustomTheme from '../../../decorators/CustomTheme';
import { BindModel } from '../../../decorators';
import { TableOfContentProperty } from '../../../decorators';

import VideoOverlay  from './VideoOverlay.js';
import ImageOverlay  from './ImageOverlay.js';
import audioData from './audioData.js';
import { stringToBoolean } from '../../../utils';
import BarcodeUtilFunctions from './barcode-util-functions.js';

const SCAN_TIMEOUT = 300;

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
  @Prop() data: any;

  @TableOfContentProperty({
    description: `A title that will be used for the current component instance.`,
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() title: string = '';

  @TableOfContentProperty({
    description: `A boolean value indicating that the current component instance is accepting files from the device. Please note that if no camera is detected, this feature will be automatically enabled.`,
    isMandatory: false,
    propertyType: `boolean`
  })
  @Prop() allowFileBrowsing: boolean = false;

  @TableOfContentProperty({
    description: [
      `A boolean value indicating the scope of the 2D matrix of scanner.`,
      `If it is <code>true</code> the component will analyze only the center square / frame.`,
      `Otherwise the entire screen.`
    ],
    isMandatory: false,
    propertyType: `boolean`
  })
  @Prop() disableFrame = false;

  private componentIsDisconnected = false;
  private ZXing = null;
  private decodePtr = null;
  private videoElement = null;
  private cameraIsAvailable = false;
  private cameraIsOn = false;
  private overlay = null;

  stopTracks() {
    if (window['stream']) {
      window['stream'].getTracks().forEach(track => track.stop());
      this.cameraIsOn = false;
    }
  }

  handleCameraError = (error) => {
    console.log('Error: ', error);
    // this.cameraIsAvailable = false;
    // this.stopCameraUsage();
  }

  changeCamera = () => {
    this.stopTracks()
    this.getStream();
  }

  drawOverlays(scannerContainer) {
    this.overlay = new VideoOverlay(scannerContainer, this.videoElement);
    this.overlay.createOverlaysCanvases('lensCanvas', 'overlayCanvas');
    this.overlay.drawLensCanvas();
  }

  cleanupOverlays() {
    if (this.overlay) {
      this.overlay.removeOverlays();
    }
  }

  /**
   * stop camera and prepare the view for enabling it again
   */
  stopCameraUsage() {
    let scannerContainer = this.element.querySelector('#scanner_container');
    let useCameraBtn = this.element.querySelector('#use-camera-btn');

    if (useCameraBtn) {
      if (this.cameraIsAvailable) {
        this.stopTracks();
        useCameraBtn.style.display = 'block';
      } else {
        useCameraBtn.style.display = 'none';
      }
    }

    this.element.querySelector('#video').style.display = 'none';
    this.element.querySelector('#camera-source').style.display = 'none';
    let videoSelectOptions = this.element.querySelector('select#videoSource');
    videoSelectOptions.options.length = 0;
    videoSelectOptions.removeEventListener('change', this.changeCamera);

    this.cleanupOverlays();
    this.overlay = new ImageOverlay(scannerContainer);
    this.overlay.createOverlaysCanvases('imageCanvas');
  }

  /**
   * start camera and prepare the view for overlaying the video stream
   */
  startCameraUsage() {
    let useCameraBtn = this.element.querySelector('#use-camera-btn');
    if (useCameraBtn) {
      useCameraBtn.style.display = 'none';
    }
    this.element.querySelector('#video').style.display = 'block';
    this.element.querySelector('#camera-source').style.display = 'block';

    let scannerContainer = this.element.querySelector('#scanner_container');
    this.cleanupOverlays();
    this.startCameraScan();
    this.drawOverlays(scannerContainer);

    window.addEventListener('resize', _ => {
      this.cleanupOverlays();
      this.drawOverlays(scannerContainer);
    });
  }

  removeDeviceIdFromList(deviceId) {
    let camerasSelectList = this.element.querySelector('select#videoSource');
    for (let i = 0; i < camerasSelectList.length; i++) {
      if (camerasSelectList.options[i].value === deviceId) {
        camerasSelectList.remove(i);
        if (camerasSelectList.length) {
          camerasSelectList.selectedIndex = i;
        } else {
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
    let scannerContainer = this.element.querySelector('#scanner_container');

    let alternativeCameras = Array.from(camerasSelectList.querySelectorAll('option')).map((option: any) => {
      return option.value;
    }).filter((cameraId) => {
      return cameraId !== camerasSelectList.value
    });

    let constraints = {
      audio: false
    };

    if (camerasSelectList.value) {
      constraints['video'] = {
        width: { ideal: scannerContainer.offsetWidth },
        height: { ideal: scannerContainer.offsetHeight },
        facingMode: {
          // this is the back camera
          ideal: 'environment'
        },
        deviceId: {
          exact: camerasSelectList.value
        }
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
      navigator.mediaDevices.getUserMedia(constraints).then(gotStream.bind(this)).catch(err => {
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
    let scannerContainer = this.element.querySelector('#scanner_container');

    let gotDevices = (deviceInfos) => {
      // TODO: log devices information
      console.log('[gotDevices] deviceInfos', deviceInfos);

      if (deviceInfos.length) {

        for (let i = deviceInfos.length - 1; i >= 0; --i) {
          let deviceInfo = deviceInfos[i];
          let option = document.createElement('option');
          option.value = deviceInfo.deviceId;
          if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
          }
        }

        if (videoSelect.length === 1) {
          scannerContainer.nextElementSibling.style.display = 'none';
          this.cleanupOverlays();
          this.drawOverlays(scannerContainer);
        }
      } else {
        // this.stopCameraUsage();
      }
    }

    navigator.mediaDevices.enumerateDevices()
      .then(gotDevices).then(this.getStream).catch(this.handleCameraError);
    videoSelect.addEventListener('change', this.changeCamera.bind(this));
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
    let decodeCallback = (ptr, len, _resultIndex, _resultCount, x1, y1, x2, y2, x3, y3, x4, y4) => {
      let result = new Uint8Array(this.ZXing.HEAPU8.buffer, ptr, len);
      let stringResult = '';
      let separatorIndex = 0;
      let separatorStarted = false;
      for (let i = 0; i < result.length; i++) {
        // 29 - group separator char code
        if (result[i] == 29) {
          stringResult += '(';
          separatorStarted = true;
          separatorIndex = 0;
        } else {
          stringResult += String.fromCharCode(result[i]);
          if (separatorStarted) {
            separatorIndex++;
            if (separatorIndex == 2) {
              stringResult += ')';
              separatorStarted = false;
            }
          }
        }
      }
      resultCallback({ points: {x1, y1, x2, y2, x3, y3, x4, y4}, data: stringResult });
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
    const container = this.element.querySelector('#scanner_container');

    const dimensions = {
      // original video dimensions
      original: {
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight
      },
      // resized dimensions of video (scaled for view)
      video: {
        width: this.videoElement.offsetWidth,
        height: this.videoElement.offsetHeight
      },
      // visible part from the original video
      image: {
        width: container.offsetWidth,
        height: container.offsetHeight
      }
    }

    const ratio = dimensions.original.width / dimensions.video.width;
    if (ratio) {
      dimensions.image = {
        width: ratio * container.offsetWidth,
        height: ratio * container.offsetHeight
      }
    }

    const barcodeCanvas = document.createElement('canvas');
    const barcodeContext = barcodeCanvas.getContext('2d');

    if (!this.disableFrame) {
      let { frame: frameSize } = this.overlay.getDimensions(container);

      if (ratio) {
        frameSize *= ratio;
      }

      dimensions.image.width = frameSize;
      dimensions.image.height = frameSize;
    }

    barcodeCanvas.width = dimensions.image.width;
    barcodeCanvas.height = dimensions.image.height;

    barcodeContext.drawImage(
      this.videoElement,
      (dimensions.original.width - dimensions.image.width) / 2,
      (dimensions.original.height - dimensions.image.height) / 2,
      dimensions.image.width, dimensions.image.height,
      0, 0, dimensions.image.width, dimensions.image.height
    );

    const { data } = barcodeContext.getImageData(0,0, dimensions.image.width, dimensions.image.height);

    // TODO: log image extracted from video
    // const scale = 0.35;
    // const url = barcodeCanvas.toDataURL('image/png')
    // const output = [
    //   'padding: ' + barcodeCanvas.height * scale + 'px ' + barcodeCanvas.width * scale + 'px;',
    //   'background: url('+ url +') no-repeat;',
    //   'background-size: contain;'
    // ].join(' ');
    //
    // console.log('dimensions', dimensions);
    // console.log('ratio', ratio);
    // console.log('%c ', output);

    const image = this.ZXing._resize(dimensions.image.width, dimensions.image.height);
    this.decodeImage(image, data, () => {
      if (!this.componentIsDisconnected) {
        setTimeout(() => {
          if (this.cameraIsOn) {
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
      if (typeof callback === 'function') {
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
  componentWillLoad(): Promise<any> {
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
  componentDidLoad() {
    if (this.componentIsDisconnected) return;

    if (this.cameraIsAvailable === false) {
      this.element.addEventListener('loaded-local-file', this.scanBarcodeFromUploadedFile.bind(this));
    } else {
      if (stringToBoolean(this.allowFileBrowsing)) {
        this.element.addEventListener('loaded-local-file', this.scanBarcodeFromUploadedFile.bind(this));
        this.element.addEventListener('use-camera', this.startCameraUsage.bind(this));
      }
    }

    this.initializeZXing(this.startCameraUsage.bind(this), result => {
      this.modelHandler.updateModel('data', result.data);
      audioData.play();
      this.overlay.drawOverlay(result.points);
      if (!this.componentIsDisconnected) {
        setTimeout(() => {
          if (this.cameraIsOn) this.scanBarcodeFromCamera();
        }, 1000);
      }
    });
  }

  disconnectedCallback() {
    this.componentIsDisconnected = true;
    this.stopTracks();
  }

  render() {
    if (this.componentIsDisconnected) return null;
    let fileBrowsingIsAllowed = stringToBoolean(this.allowFileBrowsing);

    const style = {
      barcodeWrapper: {
        display: 'grid', gridTemplateRows: '1fr auto',
        width: '100%', height: '100%'
      },
      videoWrapper: {
        position: 'relative',
        display: 'grid', gridTemplateRows: '1fr',
        overflow: 'hidden',
        minHeight: '300px'
      },
      video: {
        position: 'absolute',
        left: '50%', transform: 'translateX(-50%)',
        height: '100%'
      },
      controls: {
        padding: '1em', margin: '0.25em 0',
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center'
      },
      select: {
        padding: '5px',
        background: 'transparent', border: '0'
      }
    }

    // TODO: zxing testing
    // (window as any).cardinalBase}/cardinal/libs/zxing.js

    return [
      <script async src="/cardinal/libs/zxing.js"/>,
      <div title={this.title} style={style.barcodeWrapper}>
        { this.cameraIsAvailable === false
          ? (
            <psk-highlight title="No camera detected" type-of-highlight="warning">
              <p>You can still use your device files to check for barcodes!</p>
            </psk-highlight>
          )
          : [
            <div id="scanner_container" style={style.videoWrapper}>
              <video id="video" muted autoplay playsinline={true} style={style.video}/>
            </div>,
            <div style={style.controls}>
              <label htmlFor="videoSource" style={{margin: '0'}}>Video source: </label>
              <div class="select" id="camera-source">
                <select id="videoSource" style={style.select} />
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
    ];
  }
}
