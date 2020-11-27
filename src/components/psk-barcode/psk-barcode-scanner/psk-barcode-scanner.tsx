import { Component, Prop, State, Element, h } from '@stencil/core';

import CustomTheme from '../../../decorators/CustomTheme';
import { BindModel } from '../../../decorators';
import { TableOfContentProperty } from '../../../decorators';

import VideoOverlay from './VideoOverlay.js';
import audioData from './audioData.js';

const INTERVAL_ZXING_LOADED = 300;
const INTERVAL_BETWEEN_SCANS = 2000;
const DELAY_AFTER_RESULT = 500;

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

  // @TableOfContentProperty({
  //   description: `A boolean value indicating that the current component instance is accepting files from the device. Please note that if no camera is detected, this feature will be automatically enabled.`,
  //   isMandatory: false,
  //   propertyType: `boolean`
  // })
  // @Prop() allowFileBrowsing: boolean = false;

  // @TableOfContentProperty({
  //   description: [
  //     `A boolean value indicating the scope of the 2D matrix of scanner.`,
  //     `If it is <code>true</code> the component will analyze only the center square / frame.`,
  //     `Otherwise the entire screen.`
  //   ],
  //   isMandatory: false,
  //   propertyType: `boolean`
  // })
  // @Prop() disableFrame = false;

  @State() ZXing = null;
  @State() activeDeviceId: string | null = null;
  @State() cameraIsAvailable = false;

  private codeReader = null;
  private devices = [];
  private overlay = null;
  private scanDone = false;
  private componentIsDisconnected = false;

  constructor() {
    window.addEventListener('resize', _ => {
      this.cleanupOverlays();
      this.drawOverlays();
      // this.startScanning(this.activeDeviceId);
    });
  }

  drawOverlays() {
    if (!this.element) {
      return;
    }

    const videoElement = this.element.querySelector('#video');
    const scannerContainer = this.element.querySelector('#scanner-container');

    this.overlay = new VideoOverlay(scannerContainer, videoElement);
    this.overlay.createOverlaysCanvases('lensCanvas', 'overlayCanvas');
    this.overlay.drawLensCanvas();
  }

  cleanupOverlays() {
    if (this.overlay) {
      this.overlay.removeOverlays();
    }
  }

  startScanning(deviceId) {
    const videoElement = this.element.querySelector('#video');

    // let log = console.log;
    // console.log = (...args) => {
    //   if (args.length != 0 && args[0] instanceof this.ZXing.NotFoundException) {
    //     return;
    //   }
    //   log(...args);
    // }

    const constraints = {
      video: {
        facingMode: 'environment'
      }
    }

    if (deviceId && deviceId !== 'no-camera') {
      delete constraints.video.facingMode;
      constraints.video['deviceId'] = { exact: deviceId };
    }

    if (!this.scanDone) {
      this.cleanupOverlays();
      this.drawOverlays();

      this.codeReader.reset();
      this.codeReader.decodeFromConstraints(constraints, videoElement, (result, err) => {
        if (result && !this.scanDone) {
          console.log('result', result);

          if (this.modelHandler) {
            audioData.play();
            this.overlay.drawOverlay(result.resultPoints);
            this.modelHandler.updateModel('data', result.text);
            this.scanDone = true;
            // console.log = log;

            setTimeout(_ => {
              this.codeReader.reset();
              this.overlay.removeOverlays();
            }, DELAY_AFTER_RESULT);
          }
        }
        if (err && !(err instanceof this.ZXing.NotFoundException)) {
          console.error(err);
        }
      });
    }
  }

  switchCamera() {
    let devices = [undefined];

    for (const device of this.devices) {
      devices.push(device.deviceId);
    }

    let currentIndex = devices.indexOf(this.activeDeviceId);
    if (currentIndex === devices.length - 1) {
      currentIndex = -1;
    }
    currentIndex++;

    this.activeDeviceId = devices[currentIndex];
    this.scanDone = false;
  }

  async componentWillLoad() {
    let tick = () => {
      if (window['ZXing'] && !this.ZXing && !this.codeReader) {
        this.ZXing = window['ZXing'];
        this.codeReader = new this.ZXing.BrowserMultiFormatReader(null, INTERVAL_BETWEEN_SCANS);
      } else {
        setTimeout(tick, INTERVAL_ZXING_LOADED);
      }
    };

    tick();
  }

  async componentWillRender() {
    // ZXing unloaded
    if (!this.ZXing) {
      return;
    }

    // No devices yet
    if (this.devices.length === 0 || !this.activeDeviceId) {
      this.devices = await this.codeReader.listVideoInputDevices();

      if (this.devices.length > 0) {
        this.cameraIsAvailable = true;
      }
    }
  }

  async componentDidRender() {
    if (this.cameraIsAvailable && !this.componentIsDisconnected) {
      this.startScanning(this.activeDeviceId);
    }
  }

  async connectedCallback() {
    this.componentIsDisconnected = false;
  }

  async disconnectedCallback() {
    this.componentIsDisconnected = true;

    if (this.codeReader) {
      this.codeReader.reset();
    }
  }

  render() {
    const style = {
      barcodeWrapper: {
        display: 'grid', gridTemplateRows: '1fr',
        width: '100%', height: '100%'
      },
      videoWrapper: {
        position: 'relative',
        display: 'grid', gridTemplateRows: '1fr',
        overflow: 'hidden',
        minHeight: '300px'
      },
      video: {
        height: '100%', width: '100%',
        objectFit: 'cover'
      },
      hidden: {
        display: 'none'
      },
      button: {
        position: 'absolute', zIndex: '1',
        padding: '0.3em 0.6em',
        bottom: '1em', left: '50%', transform: 'translateX(-50%)',
        color: '#FFFFFF', background: 'transparent',
        borderRadius: '2px', border: '2px solid rgba(255, 255, 255, 0.75)',
        fontSize: '15px'
      }
    }

    return [
      <script async src={`${window['cardinalBase'] || ''}/cardinal/libs/zxing.new.js`}/>,
      <div title={this.title} style={style.barcodeWrapper}>
        {
          this.cameraIsAvailable === true && this.scanDone === false ? (
            <div id="scanner-container" style={style.videoWrapper}>
              <input type="file" accept="video/*" capture="camera" style={style.hidden}/>
              <video id="video" muted autoplay playsinline={true} style={style.video}/>
              <button onClick={_ => this.switchCamera()} style={style.button}>Change camera</button>
            </div>
          ) : null
        }
      </div>
    ];
  }
}
