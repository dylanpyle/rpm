# rpm

Generate a spinning video of record label artwork. Great for music videos,
social media, etc.

Instant, free, no subscriptions, no signups.

[Try it out!](https://dylanpyle.github.io/rpm/)

## Known limitations

- The "generate video" process is _slow_. It will hang the browser. This is
  mostly due to fetching the data buffers from the canvas. There are probably
  easy improvements here. Or — we could move it into a WebWorker.
- No audio support. This is [a
  limitation](https://github.com/TrevorSundberg/h264-mp4-encoder/issues/3) of
  the h264 encoder we're using. There are quite likely other good alternatives.

## Local development

```
$ npm install
$ ./x dev
```

## License

MIT
