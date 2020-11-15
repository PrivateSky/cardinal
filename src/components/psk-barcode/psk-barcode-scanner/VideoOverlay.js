import BarcodeUtilFunctions from './barcode-util-functions';
import CanvasOverlay from './CanvasOverlay';
const ANGLE_WIDTH = 50;

export default class VideoOverlay extends CanvasOverlay {

  constructor(scannerContainer, videoSource) {
    super(scannerContainer);
    this.videoSource = videoSource;
    let dimensions = this.dimensions;
    let xPadding = (dimensions.width - dimensions.frame) / 2;
    let yPadding = (dimensions.height - dimensions.frame) / 2;
    this.cropOptions = [xPadding, yPadding, dimensions.frame, dimensions.frame];
  }

  getCropOptions() {
    return this.cropOptions;
  }

  createOverlaysCanvases(lensCanvas, overlayCanvas) {
    this.lensCanvas = this.addCanvasToView(lensCanvas);
    this.overlayCanvas = this.addCanvasToView(overlayCanvas);
  }

  removeOverlays() {
    this.scannerContainer.removeChild(this.lensCanvas)
    this.scannerContainer.removeChild(this.overlayCanvas);
  }

  drawOverlay(points) {
    let { x1, y1, x2, y2, x3, y3, x4, y4 } = points;
    let paddings = [this.cropOptions[0], this.cropOptions[1]];
    let isLine = x3 + y3 + x4 + y4 === 0;

    x1 += paddings[0];
    x2 += paddings[0];
    x3 += paddings[0];
    x4 += paddings[0];

    y1 += paddings[1];
    y2 += paddings[1];
    y3 += paddings[1];
    y4 += paddings[1];

    this.overlayCanvas.width = this.dimensions.width;
    this.overlayCanvas.height = this.dimensions.height;

    if (this.overlayCanvas.getContext) {
      let ctx = this.overlayCanvas.getContext('2d');
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#48d96099'
      ctx.fillStyle = '#48d96099';

      ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      ctx.beginPath();

      if (isLine) {
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
      } else {
        let points = [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];
        BarcodeUtilFunctions.polySort(points);
        ctx.moveTo(points[0][0], points[0][1]);
        ctx.lineTo(points[1][0], points[1][1]);
        ctx.lineTo(points[2][0], points[2][1]);
        ctx.lineTo(points[3][0], points[3][1]);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#48d960FF'

      let xPadding = this.cropOptions[0];
      let yPadding = this.cropOptions[1];
      let frameWidth = this.cropOptions[2];

      this.addLensCorners(ctx, xPadding, yPadding, frameWidth, ANGLE_WIDTH);

      setTimeout(() => {
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      },500);
    }
  }

  drawLensCanvas() {
    let ctx = this.lensCanvas.getContext('2d');
    ctx.beginPath();

    let polygonPoints = [
      [0, 0],
      [this.dimensions.width, 0],
      [this.dimensions.width, this.dimensions.height],
      [0, this.dimensions.height]
    ];

    ctx.moveTo(polygonPoints[0][0], polygonPoints[0][1]);
    ctx.lineTo(polygonPoints[1][0], polygonPoints[1][1]);
    ctx.lineTo(polygonPoints[2][0], polygonPoints[2][1]);
    ctx.lineTo(polygonPoints[3][0], polygonPoints[3][1]);
    ctx.lineTo(polygonPoints[0][0], polygonPoints[0][1]);
    ctx.closePath();

    let dimensions = this.dimensions;

    let xPadding = (dimensions.width - dimensions.frame) / 2;
    let yPadding = (dimensions.height - dimensions.frame) / 2;
    let frameWidth = dimensions.frame;
    let holePoints = [
      [xPadding, yPadding],
      [xPadding, yPadding + frameWidth],
      [xPadding + frameWidth, yPadding + frameWidth],
      [xPadding + frameWidth, yPadding]
    ];
    ctx.moveTo(holePoints[0][0], holePoints[0][1]);
    ctx.lineTo(holePoints[1][0], holePoints[1][1]);
    ctx.lineTo(holePoints[2][0], holePoints[2][1]);
    ctx.lineTo(holePoints[3][0], holePoints[3][1]);
    ctx.lineTo(holePoints[0][0], holePoints[0][1]);
    ctx.closePath();

    ctx.fillStyle = '#77777799';
    ctx.strokeStyle = '#FFFFFFFF'
    ctx.lineWidth = 2;
    ctx.fill();

    this.addLensCorners(ctx, xPadding, yPadding, frameWidth, ANGLE_WIDTH);
  }

  addLensCorners(ctx, xPadding, yPadding, frameWidth, angleWidth) {
    ctx.beginPath();

    // top-left corner
    ctx.moveTo(xPadding, yPadding + angleWidth);
    ctx.lineTo(xPadding, yPadding);
    ctx.lineTo(xPadding + angleWidth, yPadding);

    // top-right corner
    ctx.moveTo(xPadding + frameWidth - angleWidth, yPadding);
    ctx.lineTo(xPadding + frameWidth, yPadding);
    ctx.lineTo(xPadding + frameWidth, yPadding + angleWidth);

    // bottom-right corner
    ctx.moveTo(xPadding + frameWidth - angleWidth, yPadding + frameWidth);
    ctx.lineTo(xPadding + frameWidth, yPadding + frameWidth);
    ctx.lineTo(xPadding + frameWidth, yPadding + frameWidth - angleWidth);

    // bottom-left corner
    ctx.moveTo(xPadding, yPadding + frameWidth - angleWidth);
    ctx.lineTo(xPadding, yPadding + frameWidth);
    ctx.lineTo(xPadding + angleWidth, yPadding + frameWidth);

    ctx.stroke();
  }
}
