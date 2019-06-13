import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
import './waveform.css'
var html2canvas = require('html2canvas')

let FPS = 15

const waveStyle = {
  barWidth: 3,
  cursorWidth: 2,
  backend: 'MediaElement',
  width: 500,
  height: 160,
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

  exportFrames() {
    const waveformWidth = 500; // px width, size of video
    this.frame = 0
    this.exportedImages = []
    this.exportTimer = setInterval(() => {
      if (this.frame < waveformWidth) {
        const nextFrame = 1/waveformWidth * this.frame
        this.wavesurfer.seekTo(nextFrame)
        html2canvas(document.querySelector(".waveformContainer")).then((canvas) => {
          this.exportedImages.push(canvas.toDataURL("image/webp"))
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
        const blob = window.Whammy.fromImageArray(this.exportedImages, FPS)
        var a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `frame-${this.frame}.jpg`
        a.click();
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
    return (
      <div>
        <div className='waveformContainer'>
          <div className='waveform'>
            <div className='wave'></div>
          </div>
        </div>
        { this.state.duration &&
          <button onClick={() => {
            this.exportFrames()
          }}>Generate</button>
        }
        <input type="file" name="file" onChange={this.onChangeHandler.bind(this)}/>
        <button type="button" onClick={this.onClickHandler.bind(this)}>Upload</button> 
      </div>
    )
  }
}

export default Waveform;