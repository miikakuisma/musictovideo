import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
import Dropzone from 'react-dropzone'
import './waveform.css'
var html2canvas = require('html2canvas')

let FPS = 1

class Waveform extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showHelp: true,
      ready: null,
      duration: null,
      currentTime: null,
      currentFrame: null,
      analysing: false,
      working: false,
      tags: {}
    }
  }

  readTags(file) {
    // Read MP3 ID3 tags and set them to state
    var jsmediatags = require("jsmediatags");
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        this.setState({ tags: tag.tags })
      },
      onError: (error) => {
        this.setState({ tags: 
          {
            album: 'Unknown',
            artist: 'Unknown',
            title: 'Unknown',
            genre: 'Unknown',
            year: 'Unknown',
          }
        })
        console.log(error);
      }
    });
  }

  componentDidMount() {
    this.wavesurfer = WaveSurfer.create({
      container: document.querySelector('.waveform'),
      ...this.props.theme
    })
    this.wavesurfer.on('loading', () => {
      this.setState({ analysing: true })
    })
    this.wavesurfer.on('ready', () => {
      this.setState({
        analysing: false,
        duration: this.wavesurfer.getDuration(),
        currentFrame: 0,
      })
    })
    this.wavesurfer.on('play', () => {
      // console.log('playback started')
    })
    this.wavesurfer.on('audioprocess', (e) => {
      // console.log('on audioprocess', e)
    })
    this.wavesurfer.on('finish', () => {
      // console.log('playback finished')
    })
    // this.wavesurfer.playPause()
    // .exportImage(format, quality)
    // .seekTo(progress) – Seeks to a progress [0..1] (0 = beginning, 1 = end).
    // .loadBlob(url) – Loads audio from a Blob or File object.
  }

  exportFrames() {
    this.setState({ working: true })
    this.frame = 1
    this.exportedImages = []
    this.exportTimer = setInterval(() => {
      if (this.frame <= this.state.duration) {
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
        this.setState({ working: false })

        // ffmpeg -i "MiikaKuisma-Lifeline.webm" -qscale 0 "temp.mp4"
        // ffmpeg -i temp.mp4 -i public/lifeline.mp3 MiikaKuisma-Lifeline.mp4

        this.compressAndDownload()
        // this.uploadFrames()
      }  
    }, 10)
  }

  compressAndDownload() {
    this.setState({ working: true })
    // Converts images from exportedImages into webm video
    const { artist, title } = this.state.tags
    const blob = window.Whammy.fromImageArray(this.exportedImages, FPS)

    // this.uploadVideo(blob)
    
    var a = document.createElement('a');
    // Create download link
    a.href = window.URL.createObjectURL(blob);
    a.download = `${artist}-${title}.webm`
    // Trigger download
    a.click();
    this.setState({ working: false })
  }

  dataURLtoFile (dataurl, filename) {
    // Converts base64 image data into an image file that can be uploaded
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

  uploadVideo(blob) {
    const data = new FormData()
    data.append('file', blob, `${blob.name}.webm`)
    axios.post("http://localhost:8000/upload", blob)
    .then(res => {
      console.log('Upload', res.statusText)
    })
  }

  uploadFrames() {
    // Process exported base64 images into image files and
    // send them to server for processing
    this.exportedImages.forEach((image, index) => {
      const file = this.dataURLtoFile(image)
      const data = new FormData()
      data.append('file', file, `frame-${1000+index}.jpg`)
      axios.post("http://localhost:8000/upload", data)
      .then(res => {
        console.log('Upload', res.statusText)
      })
    })
  }

  loadSound(file) {
    // This will load new music file and prepares it for conversion
    // Analyse waveform
    this.wavesurfer.loadBlob(file)
    // Read tags
    this.readTags(file)
  }
  
  render() {
    const { format, elements } = this.props
    const { showHelp, duration, working, analysing } = this.state
    const length = (duration / 60).toFixed(1)
    const { album, artist, title, genre, year } = this.state.tags

    return (
      <Dropzone
        accept='audio/mp3, audio/wav'
        onDrop={acceptedFiles => {
          if (acceptedFiles.length > 0) {
            this.setState({ showHelp: false })
            this.loadSound(acceptedFiles[0])
          }
        }}
      >
        {({getRootProps, getInputProps, isDragActive, isDragReject}) => (
          <div>
            <div
              className='waveformContainer'
              style={{
                width: `${format.width/2}px`,
                height: `${format.height/2}px`
              }}
              {...getRootProps()}
            >
              <div className="info">
                { elements.artist && artist && <h2>{artist}</h2> }
                { elements.album && album && <h1>{album}</h1> }
                { elements.title && title && <h1>"{title}"</h1> }
                <p>{ elements.genre && genre && genre} { year && year }</p>
              </div>
              <div className='waveform'>
                <div className='wave'></div>
              </div>
              { analysing && <div className="dropzoneInfo">
                <p>Analysing..</p>
              </div> }
              { showHelp && !isDragActive && <div className="dropzoneInfo">
                <input {...getInputProps()} />
                <div className="icon add" />
                <p>Drop music file here,<br />
                or click to browse files</p>
              </div> }
              { isDragActive && !isDragReject && <div className="dropzoneInfo withoverlay">
                <div className="icon check" />
                <p>Looking good!</p>
              </div> }
              { isDragReject && <div className="dropzoneInfo withoverlay">
                <div className="icon reject" />
                <p>File type not accepted, sorry!</p>
              </div> }
            </div>
            <div className="buttons">
              { length > 1 &&
                <button className="generate" onClick={() => {
                  this.exportFrames()
                }}>{!working ? 'Create' : 'Working..'}</button>
              }
            </div>
          </div>
        )}
      </Dropzone>
    )
  }
}

export default Waveform;