import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import Spinner from "./spinner";

const ONE_ROTATION_RADIANS = Math.PI * 2;

interface Options {
  spinner: Spinner;
  numberOfRotations: number;
  speedRpm: number;
  fps: number;
  audio: File;
}

export default async function record(options: Options): Promise<string> {
  const { spinner, numberOfRotations, speedRpm } = options;

  spinner.stop();

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: spinner.canvas.width,
      height: spinner.canvas.height,
    },
    audio: {
      codec: 'aac',
      sampleRate: 44100,
      numberOfChannels: 1
    },
    fastStart: 'in-memory'
  });

  const videoEncoder = new VideoEncoder({
    output: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (err: Error) => {
      console.error(err);
    }
  });

  videoEncoder.configure({
    codec: 'avc1.4d0028',
    width: spinner.canvas.width,
    height: spinner.canvas.height,
    bitrate: 1e6
  });

  let rotation = 0;
  let timeMicroseconds = 0;

  while (rotation < numberOfRotations * ONE_ROTATION_RADIANS) {
    const rotationAngle = rotation % ONE_ROTATION_RADIANS;
    spinner.renderFrame(rotationAngle);

    const frame = new VideoFrame(spinner.canvas, { timestamp: timeMicroseconds });
    videoEncoder.encode(frame);
    frame.close();

    timeMicroseconds += 1e6 / options.fps;
    rotation += (speedRpm / 60) * ONE_ROTATION_RADIANS / options.fps;
  }

  await videoEncoder.flush();

  const audioEncoder = new AudioEncoder({
    output: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => {
      muxer.addAudioChunk(chunk, meta);
    },
    error: (err: Error) => {
      console.error(err);
    }
  });

  const audioSampleRate = 44100;

  audioEncoder.configure({
    codec: 'mp4a.40.2',
    sampleRate: audioSampleRate,
    numberOfChannels: 1,
    bitrate: 128000
  });

  const audioReader = new FileReader();

  const unencodedData = await new Promise<ArrayBuffer>((resolve) => {
    audioReader.onload = () => {
      resolve(audioReader.result as ArrayBuffer);
    };

    audioReader.readAsArrayBuffer(options.audio);
  });

  const audioContext = new AudioContext();

  const audioBuffer = await audioContext.decodeAudioData(unencodedData);

  const audioData = new AudioData({
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: 1,
    numberOfFrames: audioBuffer.length,
    timestamp: 0,
    data: audioBuffer.getChannelData(0),
    format: 'f32-planar'
  });

  audioEncoder.encode(audioData);
  await audioEncoder.flush();

  muxer.finalize();

  spinner.start();

  const { buffer } = muxer.target;
  const blob = new Blob([buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  return url;
}
