import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
var html2canvas = require('html2canvas')

var FPS = 1

const waveStyle = {
  barWidth: 3,
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
      selectedFile: null,
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

  exportFrames(duration) {
    this.frame = 0
    this.exportTimer = setInterval(() => {
      if (this.frame < duration) {
        const nextFrame = 1/duration * this.frame
        this.wavesurfer.seekTo(nextFrame)
        html2canvas(document.querySelector(".waveform")).then((canvas) => {
          this.exportedImages.push(canvas.toDataURL("image/jpeg"))
        // var a = document.createElement('a');
        // a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
        // a.download = `frame-${this.frame}.jpg`
        // a.click();
          this.setState({
            currentFrame: this.frame + 1,
          })
          this.frame++
        })
      } else {
        clearInterval(this.exportTimer)
        console.log(this.frame + ' frames exported')
        this.uploadFrames()
      }  
    }, 10)
  }

  uploadFrames() {
    this.exportedImages.forEach((image, index) => {
      const file = this.dataURLtoFile(image)
      const data = new FormData()
      data.append('file', file, `frame-${index}.jpg`)
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
    return (
      <div>
        { this.state.duration &&
          <button onClick={() => {
            this.exportFrames(this.state.duration)
          }}>Generate</button>
        }
        <input type="file" name="file" onChange={this.onChangeHandler.bind(this)}/>
        <button type="button" onClick={this.onClickHandler.bind(this)}>Upload</button> 
        <div className='waveform'>
          <div className='wave'></div>
        </div>
      </div>
    )
  }
}

export default Waveform;