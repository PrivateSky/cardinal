import { Component, Prop, State, Element, h } from '@stencil/core';

import CustomTheme from '../../../decorators/CustomTheme';
import { BindModel } from '../../../decorators';
import { TableOfContentProperty } from '../../../decorators';

import VideoOverlay from './VideoOverlay.js';
import audioData from './audioData.js';

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
  @State() devices = [];
  @State() activeDeviceId: string | null = null;
  @State() cameraIsAvailable = false;

  private overlay = null;
  private codeReader = null;

  constructor() {
    window.addEventListener('resize', _ => {
      this.cleanupOverlays();
      this.drawOverlays();
      // this.startCamera(this.activeDeviceId);
    });
  }

  drawOverlays() {
    if (!this.element) {
      return;
    }

    const videoElement = this.element.querySelector('#video');
    let scannerContainer = this.element.querySelector('#scanner-container');

    this.overlay = new VideoOverlay(scannerContainer, videoElement);
    this.overlay.createOverlaysCanvases('lensCanvas', 'overlayCanvas');
    this.overlay.drawLensCanvas();
  }

  cleanupOverlays() {
    if (this.overlay) {
      this.overlay.removeOverlays();
    }
  }

  startCamera(deviceId) {
    const videoElement = this.element.querySelector('#video');
    // let scannerContainer = this.element.querySelector('#scanner-container');

    let log = console.log;
    console.log = (...args) => {
      if (args.length != 0 && args[0] instanceof this.ZXing.NotFoundException) {
        return;
      }
      log(...args);
    }

    const constraints = {
      video: {
        facingMode: 'environment',
        // width: { ideal: scannerContainer.offsetWidth },
        // height: { ideal: scannerContainer.offsetHeight },
      }
    }

    if (deviceId && deviceId !== 'no-camera') {
      delete constraints.video.facingMode;
      constraints.video['deviceId'] = { exact: deviceId };
    }

    this.cleanupOverlays();
    this.drawOverlays();

    this.codeReader.reset()
    this.codeReader.decodeFromConstraints(constraints, videoElement, (result, err) => {
      if (result) {
        console.log('result', result);
        if (this.modelHandler) {
          this.overlay.drawOverlay(result.resultPoints);
          audioData.play();
          this.modelHandler.updateModel('data', result.text);
        }
      }
      if (err && !(err instanceof this.ZXing.NotFoundException)) {
        console.error(err);
      }
    });
  }

  cameraChanged(deviceId) {
    this.activeDeviceId = deviceId;
    // this.startCamera(this.activeDeviceId);
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
  }

  async componentWillLoad() {
    let tick = () => {
      if (window['ZXing']) {
        this.ZXing = window['ZXing'];
        this.codeReader = new this.ZXing.BrowserMultiFormatReader();
      } else {
        setTimeout(tick, SCAN_TIMEOUT);
      }
    };

    setTimeout(tick, SCAN_TIMEOUT);
  }

  async componentWillRender() {
    // ZXing unloaded
    if (!this.ZXing) {
      return;
    }

    // No devices yet
    if (this.devices.length === 0 || !this.activeDeviceId) {
      this.devices = await this.codeReader.listVideoInputDevices();
      // console.log('devices', this.devices);

      if (this.devices.length > 0) {
        this.cameraIsAvailable = true;
      }
    }
  }

  async componentDidRender() {
    if (this.cameraIsAvailable) {
      this.startCamera(this.activeDeviceId);
    }
  }

  render() {
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
        // position: 'absolute',
        // left: '50%', transform: 'translateX(-50%)',
        height: '100%', width: '100%',
        objectFit: 'cover'
      },
      controls: {
        padding: '1em', margin: '0.25em 0',
        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center'
      },
      select: {
        padding: '5px',
        background: 'transparent', border: '0'
      },
      hidden: {
        display: 'none'
      }
    }

    // const selectCamera = (
    //   <select style={style.select} onChange={(e: any) => this.cameraChanged(e.target.value)}>
    //     <option value="no-camera">Select camera</option>
    //     {
    //       this.devices.map(device => (
    //         <option value={device.deviceId}>{device.label}</option>
    //       ))
    //     }
    //   </select>
    // );

    return [
      <script async src={`${(window as any).cardinalBase || ''}/cardinal/libs/zxing.new.js`}/>,
      <div title={this.title} style={style.barcodeWrapper}>
        {
          this.cameraIsAvailable === false
          ? (
            <psk-highlight title="No camera detected" type-of-highlight="warning">
              <p>You can still use your device files to check for barcodes!</p>
            </psk-highlight>
          )
          : [
            <div id="scanner-container" style={style.videoWrapper}>
              <input type="file" accept="video/*" capture="camera" style={style.hidden}/>
              <video id="video" muted autoplay playsinline={true} style={style.video}/>
            </div>,
            <div style={style.controls}>
              <button onClick={_ => this.switchCamera()}>Change camera</button>

              {/*<label htmlFor="video-source" style={{margin: '0'}}>Video source: </label>*/}
              {/*<div id="camera-source" class="select" >*/}
              {/*  {selectCamera}*/}
              {/*</div>*/}
            </div>
          ]
        }
        { this.cameraIsAvailable === false
          ? [
            <psk-files-chooser accept="image/*" label="Load a file from device" event-name="loaded-local-file"/>,
            <psk-button id="use-camera-btn" label="Use camera" style={style.hidden} event-name="use-camera"/>
          ]
          : null
        }
      </div>
    ];
  }
}
