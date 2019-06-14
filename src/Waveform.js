import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
import './waveform.css'
var html2canvas = require('html2canvas')

let FPS = 1

const waveStyle = {
  barWidth: 2,
  cursorWidth: 2,
  backend: 'MediaElement',
  width: 500,
  height: 200,
  progressColor: '#ffc107',
  responsive: true,
  waveColor: '#fff',
  cursorColor: 'transparent',
}

class Waveform extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedFile: null,
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
    this.wavesurfer.on('ready', () => {
      this.setState({
        duration: this.wavesurfer.getDuration(),
        currentFrame: 0,
      })
    })
    this.wavesurfer.on('play', () => {
      console.log('playback started')
    })
    this.wavesurfer.on('audioprocess', (e) => {
      console.log('on audioprocess', e)
    })
    this.wavesurfer.on('finish', () => {
      console.log('playback finished')
    })
    // this.wavesurfer.playPause()
    // .exportImage(format, quality)
    // .seekTo(progress) – Seeks to a progress [0..1] (0 = beginning, 1 = end).
    // .loadBlob(url) – Loads audio from a Blob or File object.
  }

  saveFrame() {
    const _this = this
    return (
      new Promise(function(resolve, reject) {
        html2canvas(document.querySelector(".waveformContainer")).then((canvas) => {
          _this.exportedImages.push(canvas.toDataURL("image/webp"))
          resolve({
            canvas,
            frame: _this.exportedImages.length
          });
        })
      })
    )
  }

  compressAndDownload() {
    const blob = window.Whammy.fromImageArray(this.exportedImages, FPS)
    var a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = `frame-${this.frame}.jpg`
    a.click();
  }

  dataURLtoFile (dataurl, filename) {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n) {
      u8arr[n-1] = bstr.charCodeAt(n-1)
      n -= 1 // to make eslint happy
    }
    return new File([u8arr], filename, { type: mime })
  }

  exportFrames() {
    this.frame = 0
    this.exportedImages = []
    this.exportTimer = setInterval(() => {
      if (this.frame < this.state.duration) {
        const nextFrame = 1/this.state.duration * this.frame
        this.wavesurfer.seekTo(nextFrame)
        html2canvas(document.querySelector(".waveformContainer")).then((canvas) => {
          this.exportedImages.push(canvas.toDataURL("image/webp"))
          this.setState({
            currentFrame: this.frame + 1,
          })
          this.frame++
        })
      } else {
        clearInterval(this.exportTimer)
        console.log(this.frame + ' frames exported')
        this.compressAndDownload()
        // this.uploadFrames()
      }  
    }, 10)
  }

  uploadFrames() {
    this.exportedImages.forEach((image, index) => {
      const file = this.dataURLtoFile(image)
      const data = new FormData()
      data.append('file', file, `frame-${100+index}.jpg`)
      axios.post("http://localhost:8000/upload", data)
      .then(res => {
        console.log('Upload', res.statusText)
      })
    })
    console.log('now would be time to compress')
  }

  onChangeHandler (event) {
    this.setState({
      selectedFile: event.target.files[0],
      loaded: 0,
    })
  }

  onClickHandler () {
    const data = new FormData() 
    data.append('file', this.state.selectedFile)
    axios.post("http://localhost:8000/upload", data, { 
      // receive two    parameter endpoint url ,form data
    })
    .then(res => { // then print response status
      console.log(res.statusText)
    })
  }
  
  render() {
    const length = (this.state.duration / 60).toFixed(1)
    return (
      <div>
        <div className='waveformContainer'>
          <div className="info">
            <h1>Miika Kuisma - Lifeline</h1>
            <p>Duration: {length} min</p>
          </div>
          <div className='waveform'>
            <div className='wave'></div>
          </div>
        </div>
        { this.state.duration &&
          <button onClick={() => {
            this.exportFrames()
          }}>Generate</button>
        }
        <button onClick={() => { this.wavesurfer.playPause() }}>Play</button>
        <input type="file" name="file" onChange={this.onChangeHandler.bind(this)}/>
        <button type="button" onClick={this.onClickHandler.bind(this)}>Upload</button> 
      </div>
    )
  }
}

export default Waveform;