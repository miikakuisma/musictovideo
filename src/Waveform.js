import React from 'react'
import WaveSurfer from 'wavesurfer.js'
var videoshow = require('videoshow')
var html2canvas = require('html2canvas')

var FPS = 25

const waveStyle = {
  barWidth: 5,
  cursorWidth: 2,
  backend: 'MediaElement',
  height: 80,
  progressColor: '#4a74a5',
  responsive: true,
  waveColor: '#ccc',
  cursorColor: '#4a74a5',
}

class Waveform extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ready: null,
      duration: null,
      currentTime: null,
      currentFrame: null,
    }
  }

  componentDidMount() {
    this.exportedImages = []
    this.wavesurfer = WaveSurfer.create({
      container: document.querySelector('.waveform'),
      ...waveStyle
    })
    this.wavesurfer.load(this.props.src)
    // this.wavesurfer.setWidth('1920')
    this.wavesurfer.on('ready', () => {
      this.setState({
        duration: this.wavesurfer.getDuration() * FPS,
        currentFrame: 0,
      })
    })
    // this.wavesurfer.playPause()
    // .exportImage(format, quality)
    // .seekTo(progress) – Seeks to a progress [0..1] (0 = beginning, 1 = end).
    // .loadBlob(url) – Loads audio from a Blob or File object.
  }

  exportFrames(duration) {
    this.frame = 0
    this.exportTimer = setInterval(() => {
      if (this.frame < duration) {
        const nextFrame = 1/duration * this.frame
        this.wavesurfer.seekTo(nextFrame)
        // this.exportedImages.push(this.wavesurfer.exportImage());

        html2canvas(document.querySelector(".waveform")).then((canvas) => {
          this.exportedImages.push(canvas)
          // var a = document.createElement('a');
          // a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
          // a.download = `frame-${this.frame}.jpg`
          // a.click();
        })

        this.setState({
          currentFrame: this.frame + 1,
        })
        this.frame++
      } else {
        clearInterval(this.exportTimer)
        console.log(this.frame + ' frames exported')
        this.compressToVideo()
      }  
    }, 1)
  }

  compressToVideo() {
    const videoOptions = {
      fps: FPS,
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

    videoshow(this.exportedImages, videoOptions)
    .audio(this.props.src)
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
  }
  
  render() {
    return (
      <div>
        { this.state.duration &&
          <button onClick={() => {
            this.exportFrames(this.state.duration)
          }}>Generate</button>
        }
        <div className='waveform'>
          <div className='wave'></div>
        </div>
      </div>
    )
  }
}

export default Waveform;