import Spinner, { Options } from "./spinner";
import record from "./record";

const DEFAULT_SIZE = 1024;

const previewCanvas = document.querySelector(
  ".preview-canvas",
) as HTMLCanvasElement;

previewCanvas.width = DEFAULT_SIZE;
previewCanvas.height = DEFAULT_SIZE;

const speedInput = document.querySelector(".speed-input") as HTMLInputElement;

const backgroundInput = document.querySelector(
  ".background-color-input",
) as HTMLInputElement;

const imageInput = document.querySelector(".image-input") as HTMLInputElement;
const audioInput = document.querySelector(".audio-input") as HTMLInputElement;

const paddingInput = document.querySelector(
  ".padding-input",
) as HTMLInputElement;

const showCenterHoleInput = document.querySelector(
  ".show-hole-input",
) as HTMLInputElement;

const downloadButtons = document.querySelectorAll(
  ".download-button",
) as NodeListOf<HTMLButtonElement>;

const image = new Image();
image.src = "sample.jpg";

const options: Options = {
  paddingPercent: parseInt(paddingInput.value),
  speedRpm: parseFloat(speedInput.value),
  backgroundColor: backgroundInput.value,
  showCenterHole: showCenterHoleInput.checked,
  image,
};

let audio: ArrayBuffer | null = null;

backgroundInput.addEventListener(
  "input",
  () => {
    options.backgroundColor = backgroundInput.value;
  },
);

speedInput.addEventListener(
  "input",
  () => options.speedRpm = parseFloat(speedInput.value),
);

imageInput.addEventListener("input", () => {
  const file = imageInput.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener("load", () => {
    options.image.src = reader.result as string;
  });

  reader.readAsDataURL(file);
});

audioInput.addEventListener("input", async () => {
  const file = audioInput.files?.[0];

  if (!file) {
    return;
  }

  const audioReader = new FileReader();

  const unencodedData = await new Promise<ArrayBuffer>((resolve) => {
    audioReader.onload = () => {
      resolve(audioReader.result as ArrayBuffer);
    };

    audioReader.readAsArrayBuffer(file);
  });

  audio = unencodedData;
});

paddingInput.addEventListener("input", () => {
  options.paddingPercent = parseInt(paddingInput.value);
});

showCenterHoleInput.addEventListener("input", () => {
  options.showCenterHole = showCenterHoleInput.checked;
});

const spinner = new Spinner(previewCanvas, options);
spinner.start();

async function onDownloadButtonClick(event: MouseEvent) {
  if (!(event.target instanceof HTMLButtonElement)) {
    return;
  }

  const originalLabel = event.target.textContent;

  const { dataset } = event.target;

  if (!dataset.fps || !dataset.size) {
    alert("Error: download button missing required attributes");
    return;
  }

  const fps = parseInt(dataset.fps);
  const size = parseInt(dataset.size);
  event.target.disabled = true;
  event.target.textContent = "Generating video (please hold)...";

  previewCanvas.width = size;
  previewCanvas.height = size;

  // Allow a DOM repaint to show the loading message
  await new Promise((resolve) => setTimeout(resolve, 20));

  const url = await record({
    speedRpm: options.speedRpm,
    spinner,
    fps,
    audio,
  });

  const a = document.createElement("a");
  a.href = url;
  a.download = "spinner.mp4";
  a.click();

  previewCanvas.width = DEFAULT_SIZE;
  previewCanvas.height = DEFAULT_SIZE;

  event.target.disabled = false;
  event.target.textContent = originalLabel;
}

for (const button of downloadButtons) {
  button.addEventListener("click", onDownloadButtonClick);
}
