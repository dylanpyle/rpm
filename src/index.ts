import Spinner, { Options } from "./spinner";

const previewCanvas = document.querySelector(
  ".preview-canvas",
) as HTMLCanvasElement;

const speedInput = document.querySelector(".speed-input") as HTMLInputElement;

const backgroundInput = document.querySelector(
  ".background-color-input",
) as HTMLInputElement;

const imageInput = document.querySelector(".image-input") as HTMLInputElement;

const paddingInput = document.querySelector(
  ".padding-input",
) as HTMLInputElement;

const showCenterHoleInput = document.querySelector(
  ".show-hole-input",
) as HTMLInputElement;

const downloadButton = document.querySelector(
  ".download-button",
) as HTMLButtonElement;

const image = new Image();
image.src = "/sample.jpg";

const options: Options = {
  paddingPercent: parseInt(paddingInput.value),
  speedRpm: parseInt(speedInput.value),
  backgroundColor: backgroundInput.value,
  showCenterHole: showCenterHoleInput.checked,
  image,
};

backgroundInput.addEventListener(
  "input",
  () => {
    options.backgroundColor = backgroundInput.value;
  },
);

speedInput.addEventListener(
  "input",
  () => options.speedRpm = parseInt(speedInput.value),
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

paddingInput.addEventListener("input", () => {
  options.paddingPercent = parseInt(paddingInput.value);
});

showCenterHoleInput.addEventListener("input", () => {
  options.showCenterHole = showCenterHoleInput.checked;
});

const spinner = new Spinner(previewCanvas, options);
spinner.start();
