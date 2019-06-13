var videoshow = require('videoshow')

  let images = []
  const testFolder = 'uploads/';
  const fs = require('fs');
  fs.readdirSync(testFolder).forEach(file => {
    images.push('uploads/' + file)
  });

  // fs.readdir(testFolder, (err, files) => {
  //   files.forEach(file => {
  //     images.push('uploads/' + file)
  //   });
  // });

  console.log(images)

  const videoOptions = {
    fps: 0.2986056942277691,
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
