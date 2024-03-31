import {
  drawCenterHole,
  drawImage,
  fillBackground,
  rotateContext,
} from "./draw";

const startTime = Date.now();

const MS_PER_MINUTE = 60 * 1000;
const ONE_ROTATION_RADIANS = Math.PI * 2;

export interface Options {
  paddingPercent: number;
  speedRpm: number;
  backgroundColor: string;
  showCenterHole: boolean;
  image: HTMLImageElement;
}

export default class Spinner {
  private options: Options;
  private ctx: CanvasRenderingContext2D;
  public canvas: HTMLCanvasElement;

  private croppedImageBuffer: HTMLCanvasElement;
  private croppedImageCtx: CanvasRenderingContext2D;

  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement, options: Options) {
    this.canvas = canvas;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      throw new Error("Error getting context");
    }

    this.ctx = ctx;
    this.options = options;

    this.croppedImageBuffer = document.createElement("canvas");
    this.croppedImageBuffer.width = ctx.canvas.width;
    this.croppedImageBuffer.height = ctx.canvas.height;
    const croppedImageCtx = this.croppedImageBuffer.getContext("2d");

    if (!croppedImageCtx) {
      throw new Error("Error getting buffer context");
    }

    this.croppedImageCtx = croppedImageCtx;
    this.options.image.addEventListener("load", this.onImageLoad);
  }

  public renderFrame(rotationAngle: number) {
    const { options, ctx, canvas } = this;

    ctx.resetTransform();

    fillBackground(ctx, canvas, options.backgroundColor);
    rotateContext(ctx, canvas, rotationAngle);
    drawImage(ctx, canvas, this.croppedImageBuffer, this.getPaddingPx());

    if (options.showCenterHole) {
      drawCenterHole(ctx, canvas, this.getPaddingPx(), options.backgroundColor);
    }
  }

  private renderLoop = () => {
    const { isRunning } = this;

    if (!isRunning) {
      return;
    }

    const rotationAngle = this.getRotationAngle();
    this.renderFrame(rotationAngle);

    requestAnimationFrame(this.renderLoop);
  };

  private getPaddingPx() {
    return this.options.paddingPercent / 100 * this.ctx.canvas.width;
  }

  private getRotationAngle() {
    const minutesPassed = (Date.now() - startTime) / MS_PER_MINUTE;
    const numberOfRotations = minutesPassed * this.options.speedRpm;
    const rotationAngle = (ONE_ROTATION_RADIANS * numberOfRotations) %
      ONE_ROTATION_RADIANS;

    return rotationAngle;
  }

  private onImageLoad = () => {
    const { image } = this.options;

    if (!this.croppedImageCtx) {
      return;
    }

    const aspectRatio = image.width / image.height;

    let drawWidth = this.canvas.width;
    let drawHeight = this.canvas.height;

    if (aspectRatio > 1) {
      drawWidth = this.canvas.width * aspectRatio;
    } else {
      drawHeight = this.canvas.height / aspectRatio;
    }

    const xOffset = (this.canvas.width - drawWidth) / 2;
    const yOffset = (this.canvas.height - drawHeight) / 2;

    this.croppedImageCtx.drawImage(
      image,
      xOffset,
      yOffset,
      drawWidth,
      drawHeight,
    );
  };

  public start() {
    this.isRunning = true;
    this.renderLoop();
  }

  public stop() {
    this.isRunning = false;
  }

  public getImageData(): Uint8ClampedArray {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      .data;
  }
}
