export function rotateContext(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  angle: number,
) {
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(angle);
  context.translate(-canvas.width / 2, -canvas.height / 2);
}

export function fillBackground(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  backgroundColorValue: string,
) {
  context.fillStyle = backgroundColorValue;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawImage(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | HTMLCanvasElement,
  padding: number,
) {
  context.save();
  context.beginPath();

  context.arc(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2 - padding,
    0,
    Math.PI * 2,
  );

  context.clip();

  context.drawImage(
    image,
    padding,
    padding,
    canvas.width - padding * 2,
    canvas.height - padding * 2,
  );

  context.restore();
}

// Assumes center hole is 0.25in on a 4in label (standard)
export function drawCenterHole(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  padding: number,
  backgroundColorValue: string,
) {
  const labelSize = canvas.width - (padding * 2);
  const radius = labelSize / 32;

  context.beginPath();
  context.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
  context.fillStyle = backgroundColorValue;
  context.fill();
}
