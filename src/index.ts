/** DOM elements **/

const previewCanvas = document.querySelector(
  ".preview-canvas",
) as HTMLCanvasElement;

const previewContext = previewCanvas.getContext("2d");

const speedInput = document.querySelector(".speed-input") as HTMLInputElement;

const backgroundInput = document.querySelector(
  ".background-color-input"
) as HTMLInputElement;

const imageInput = document.querySelector(".image-input") as HTMLInputElement;

const paddingInput = document.querySelector(".padding-input") as HTMLInputElement;

const showCenterHoleInput = document.querySelector(
  ".show-hole-input"
) as HTMLInputElement;

const downloadButton = document.querySelector(".download-button") as HTMLButtonElement;


/** Globals **/

previewCanvas.width = CANVAS_SIZE;
previewCanvas.height = CANVAS_SIZE;

let backgroundColorValue = backgroundInput.value;

let image: HTMLImageElement = new Image();
image.src = "/sample.jpg";

const startTime = Date.now();

const croppedImageCanvas = document.createElement("canvas");
croppedImageCanvas.width = CANVAS_SIZE;
croppedImageCanvas.height = CANVAS_SIZE;

const croppedImageContext = croppedImageCanvas.getContext("2d");

/** Rendering logic **/

function getPaddingPx() {
  return options.padding / 100 * CANVAS_SIZE;
}

function rotateContext(context: CanvasRenderingContext2D, angle: number) {
  context.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  context.rotate(angle);
  context.translate(-CANVAS_SIZE / 2, -CANVAS_SIZE / 2);
}

function fillBackground(context: CanvasRenderingContext2D) {
  context.fillStyle = backgroundColorValue;
  context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

const msPerMinute = 60 * 1000;
const oneRotation = Math.PI * 2;

function getRotationAngle() {
  const minutesPassed = (Date.now() - startTime) / msPerMinute;
  const numberOfRotations = minutesPassed * options.speedRpm;
  const rotationAngle = (oneRotation * numberOfRotations) % oneRotation;

  return rotationAngle;
}

function drawImage(context: CanvasRenderingContext2D) {
  context.save();
  context.beginPath();

  const padding = getPaddingPx();

  context.arc(
    CANVAS_SIZE / 2,
    CANVAS_SIZE / 2,
    CANVAS_SIZE / 2 - padding,
    0,
    Math.PI * 2,
  );

  context.clip();

  context.drawImage(
    croppedImageCanvas,
    getPaddingPx(),
    padding,
    CANVAS_SIZE - padding * 2,
    CANVAS_SIZE - padding * 2,
  );

  context.restore();
}

// Assumes center hole is 0.25in on a 4in label (standard)
function drawCenterHole(context: CanvasRenderingContext2D) {
  const labelSize = CANVAS_SIZE - (getPaddingPx() * 2);
  const radius = labelSize / 32;

  context.beginPath();
  context.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, radius, 0, Math.PI * 2);
  context.fillStyle = backgroundColorValue;
  context.fill();
}

function render() {
  if (!previewContext || !image.complete) {
    return requestAnimationFrame(render);
  }

  previewContext.resetTransform();

  fillBackground(previewContext);
  rotateContext(previewContext, getRotationAngle());
  drawImage(previewContext);

  if (options.showCenterHole) {
    drawCenterHole(previewContext);
  }

  requestAnimationFrame(render);
}

requestAnimationFrame(render);

/* Video recording */

/** Event listeners **/

backgroundInput.addEventListener(
  "input",
  () => {
    backgroundColorValue = backgroundInput.value;
  }
);

speedInput.addEventListener("input", () => 
  options.speedRpm = parseInt(speedInput.value)
);

imageInput.addEventListener("input", () => {
  const file = imageInput.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    image.src = reader.result as string;
  });

  reader.readAsDataURL(file);
});

paddingInput.addEventListener("input", () => {
  options.padding = parseInt(paddingInput.value);
});

showCenterHoleInput.addEventListener("input", () => {
  options.showCenterHole = showCenterHoleInput.checked;
});

downloadButton.addEventListener("click", () => {
  downloadButton.disabled = true;
  downloadButton.textContent = "Recording a full rotation...";

  const videoStream = previewCanvas.captureStream(60);
  const mediaRecorder = new MediaRecorder(videoStream, {
    mimeType: 'video/webm',
    videoBitsPerSecond: 25 * 1024 * 1024,
  });

  const chunks: Blob[] = [];
  
  mediaRecorder.ondataavailable = (event) => {
    chunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "label-spin.webm";
    a.click();
  }

  mediaRecorder.start();

  setTimeout(() => {
    mediaRecorder.stop()
    downloadButton.disabled = false;
    downloadButton.textContent = "Download";
  }, 60000 / options.speedRpm);
});

image.addEventListener("load", () => {
  if (!croppedImageContext) {
    return;
  }

  const aspectRatio = image.width / image.height;
  console.log(aspectRatio);

  let drawWidth = CANVAS_SIZE;
  let drawHeight = CANVAS_SIZE;

  if (aspectRatio > 1) {
    drawWidth = CANVAS_SIZE * aspectRatio;
  } else {
    drawHeight = CANVAS_SIZE / aspectRatio;
  }

  const xOffset = (CANVAS_SIZE - drawWidth) / 2;
  const yOffset = (CANVAS_SIZE - drawHeight) / 2;

  croppedImageContext.drawImage(
    image,
    xOffset,
    yOffset,
    drawWidth,
    drawHeight,
  );
});

