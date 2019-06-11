import React from 'react'
import WaveSurfer from 'wavesurfer.js'

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

const FPS = 25

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
    this.exportedImages = []
    this.exportTimer = setInterval(() => {
      if (this.frame < duration) {
        const nextFrame = 1/duration * this.frame
        this.wavesurfer.seekTo(nextFrame)
        this.exportedImages.push('this.wavesurfer.exportImage()');
        this.setState({
          currentFrame: this.frame + 1,
        })
        this.frame++
      } else {
        clearInterval(this.exportTimer)
        console.log(this.frame + ' frames exported')
      }  
    })
  }

  getNextFrame(frame) {
    

    
  }

  componentDidUpdate() {
    // this.setState({
    //   currentTime: this.wavesurfer.getCurrentTime()
    // })
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