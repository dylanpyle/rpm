import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import Spinner from "./spinner";

const ONE_ROTATION_RADIANS = Math.PI * 2;
const ONE_SECOND_MICROSECONDS = 1e6;
const AUDIO_BITRATE = 128000;
const VIDEO_BITRATE = 1e6;
const AUDIO_SAMPLE_RATE = 44100;

interface Options {
  spinner: Spinner;
  speedRpm: number;
  fps: number;
  audio: ArrayBuffer | null;
}

export default async function record(options: Options): Promise<string> {
  const { spinner, speedRpm } = options;

  spinner.stop();

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width: spinner.canvas.width,
      height: spinner.canvas.height,
    },
    audio: options.audio
      ? {
        codec: "aac",
        sampleRate: AUDIO_SAMPLE_RATE,
        numberOfChannels: 1,
      }
      : undefined,
    fastStart: "in-memory",
  });

  const defaultLengthSeconds = (60 / speedRpm) * 3;

  let lengthSeconds = defaultLengthSeconds;

  if (options.audio) {
    const audioEncoder = new AudioEncoder({
      output: (chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata) => {
        muxer.addAudioChunk(chunk, meta);
      },
      error: (err: Error) => {
        console.error(err);
      },
    });

    audioEncoder.configure({
      codec: "mp4a.40.2",
      sampleRate: AUDIO_SAMPLE_RATE,
      numberOfChannels: 1,
      bitrate: AUDIO_BITRATE,
    });

    const audioContext = new AudioContext();

    const audioBuffer = await audioContext.decodeAudioData(options.audio);
    lengthSeconds = audioBuffer.duration;

    const audioData = new AudioData({
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: 1,
      numberOfFrames: audioBuffer.length,
      timestamp: 0,
      data: audioBuffer.getChannelData(0),
      format: "f32-planar",
    });

    audioEncoder.encode(audioData);
    await audioEncoder.flush();
  }

  const videoEncoder = new VideoEncoder({
    output: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (err: Error) => {
      console.error(err);
    },
  });

  videoEncoder.configure({
    codec: "avc1.4d0028",
    width: spinner.canvas.width,
    height: spinner.canvas.height,
    bitrate: VIDEO_BITRATE,
  });

  let rotation = 0;
  let timeMicroseconds = 0;

  const durationMicroseconds = lengthSeconds * ONE_SECOND_MICROSECONDS;

  while (timeMicroseconds < durationMicroseconds) {
    const rotationAngle = rotation % ONE_ROTATION_RADIANS;
    spinner.renderFrame(rotationAngle);

    const frame = new VideoFrame(spinner.canvas, {
      timestamp: timeMicroseconds,
    });
    videoEncoder.encode(frame);
    frame.close();

    timeMicroseconds += ONE_SECOND_MICROSECONDS / options.fps;
    rotation += (speedRpm / 60) * ONE_ROTATION_RADIANS / options.fps;
  }

  await videoEncoder.flush();

  muxer.finalize();

  spinner.start();

  const { buffer } = muxer.target;
  const blob = new Blob([buffer], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);
  return url;
}
