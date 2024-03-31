import { CANVAS_SIZE } from "./config";

export function rotateContext(
  context: CanvasRenderingContext2D,
  angle: number,
) {
  context.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  context.rotate(angle);
  context.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2);
}

export function fillBackground(
  context: CanvasRenderingContext2D,
  backgroundColorValue: string,
) {
  context.fillStyle = backgroundColorValue;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

export function drawImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | HTMLCanvasElement,
  padding: number,
) {
  context.save();
  context.beginPath();

  context.arc(
    CANVAS_SIZE / 2,
    CANVAS_SIZE / 2,
    CANVAS_SIZE / 2 - padding,
    0,
    Math.PI * 2,
  );

  context.clip();

  context.drawImage(
    image,
    padding,
    padding,
    CANVAS_SIZE - padding * 2,
    CANVAS_SIZE - padding * 2,
  );

  context.restore();
}

// Assumes center hole is 0.25in on a 4in label (standard)
export function drawCenterHole(
  context: CanvasRenderingContext2D,
  padding: number,
  backgroundColorValue: string,
) {
  const labelSize = CANVAS_SIZE - (padding * 2);
  const radius = labelSize / 32;

  context.beginPath();
  context.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, radius, 0, Math.PI * 2);
  context.fillStyle = backgroundColorValue;
  context.fill();
}
