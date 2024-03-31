import { createH264MP4Encoder } from "h264-mp4-encoder";
import Spinner from "./spinner";

const ONE_ROTATION_RADIANS = Math.PI * 2;

interface Options {
  spinner: Spinner;
  numberOfRotations: number;
  speedRpm: number;
  fps: number;
}

export default async function record(options: Options): Promise<string> {
  const { spinner, numberOfRotations, speedRpm } = options;

  spinner.stop();

  const encoder = await createH264MP4Encoder();
  encoder.width = spinner.canvas.width;
  encoder.height = spinner.canvas.height;
  encoder.frameRate = options.fps;
  encoder.groupOfPictures = 100;
  encoder.initialize();

  let rotation = 0;

  while (rotation < numberOfRotations * ONE_ROTATION_RADIANS) {
    const rotationAngle = rotation % ONE_ROTATION_RADIANS;
    spinner.renderFrame(rotationAngle);
    encoder.addFrameRgba(spinner.getImageData());

    rotation += (speedRpm / 60) * ONE_ROTATION_RADIANS / options.fps;
  }

  encoder.finalize();
  const uint8array = encoder.FS.readFile(encoder.outputFilename);
  const url = URL.createObjectURL(
    new Blob([uint8array], { type: "video/mp4" }),
  );
  encoder.delete();

  spinner.start();

  return url;
}
