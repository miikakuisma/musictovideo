var videoshow = require('videoshow')

  const images = [
    'uploads/frame-10.jpg',
    'uploads/frame-11.jpg',
    'uploads/frame-12.jpg',
    'uploads/frame-13.jpg',
    'uploads/frame-14.jpg',
    'uploads/frame-15.jpg',
    'uploads/frame-16.jpg',
    'uploads/frame-17.jpg',
    'uploads/frame-18.jpg',
    'uploads/frame-19.jpg',
    'uploads/frame-20.jpg',
    'uploads/frame-21.jpg',
    'uploads/frame-22.jpg',
    'uploads/frame-23.jpg',
    'uploads/frame-24.jpg',
    'uploads/frame-25.jpg',
    'uploads/frame-26.jpg',
    'uploads/frame-27.jpg',
    'uploads/frame-28.jpg',
    'uploads/frame-29.jpg',
    'uploads/frame-30.jpg',
  ]

  const videoOptions = {
    fps: 1,
    // loop: 5, // seconds
    transition: false,
    transitionDuration: 1, // seconds
    videoBitrate: 1024,
    videoCodec: 'libx264',
    size: '1920x?',
    audioBitrate: '128k',
    audioChannels: 2,
    format: 'mp4',
    pixelFormat: 'yuv420p'
  }

  videoshow(images, videoOptions)
  .audio('public/lifeline.mp3')
  .save('video.mp4')
  .on('start', function (command) {
    console.log('ffmpeg process started:', command)
  })
  .on('error', function (err, stdout, stderr) {
    console.error('Error:', err)
    console.error('ffmpeg stderr:', stderr)
  })
  .on('end', function (output) {
    console.error('Video created in:', output)
  })
