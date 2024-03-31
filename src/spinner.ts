import { CANVAS_SIZE } from "./config";
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

  private croppedImageBuffer: HTMLCanvasElement;
  private croppedImageCtx: CanvasRenderingContext2D;

  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement, options: Options) {
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const ctx = canvas.getContext("2d");

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

  private render = () => {
    const { options, ctx, isRunning } = this;
    const { image } = options;

    if (!isRunning) {
      return;
    }

    if (!image.complete) {
      return requestAnimationFrame(this.render);
    }

    ctx.resetTransform();

    fillBackground(ctx, options.backgroundColor);
    rotateContext(ctx, this.getRotationAngle());
    drawImage(ctx, this.croppedImageBuffer, this.getPaddingPx());

    if (options.showCenterHole) {
      drawCenterHole(ctx, this.getPaddingPx(), options.backgroundColor);
    }

    requestAnimationFrame(this.render);
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

    let drawWidth = CANVAS_SIZE;
    let drawHeight = CANVAS_SIZE;

    if (aspectRatio > 1) {
      drawWidth = CANVAS_SIZE * aspectRatio;
    } else {
      drawHeight = CANVAS_SIZE / aspectRatio;
    }

    const xOffset = (CANVAS_SIZE - drawWidth) / 2;
    const yOffset = (CANVAS_SIZE - drawHeight) / 2;

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
    this.render();
  }

  public stop() {
    this.isRunning = false;
  }
}
