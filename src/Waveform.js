import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
import Dropzone from 'react-dropzone'
import './waveform.css'
var html2canvas = require('html2canvas')

let FPS = 2

class Waveform extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showHelp: true,
      duration: null,
      currentTime: null,
      currentFrame: null,
      analysing: false,
      working: false,
      preparing: false,
      tags: {},
      uploadedAudioFilename: null
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

  handleDropFile(acceptedFiles) {
    if (acceptedFiles.length > 0) {
      const _this = this
      this.setState({ showHelp: false })
      this.loadSound(acceptedFiles[0])
      const data = new FormData() 
      data.append('file', acceptedFiles[0])
      axios.post("http://localhost:8000/uploadMusic", data)
      .then(res => {
        _this.setState({ uploadedAudioFilename: res.data.filename })
      })
    }
  }

  loadSound(file) {
    // Analyse waveform
    this.wavesurfer.loadBlob(file)
    // Read tags
    this.readTags(file)
  }

  exportFrames() {
    this.setState({ working: true })
    this.frame = 1
    this.exportedImages = []
    this.exportTimer = setInterval(() => {
      if (this.frame <= (this.state.duration * FPS)) {
        const nextFrame = 1/(this.state.duration * FPS) * this.frame
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
        this.setState({ working: false })
        // Merge exported images into video
        this.mergeFrames()
      }  
    })
  }

  mergeFrames() {
    this.setState({ working: true })
    const { title } = this.state.tags
    const blob = window.Whammy.fromImageArray(this.exportedImages, FPS)
    const timestamp = Date.now()
    const data = new FormData()
    data.append('file', blob, `${timestamp}${this.state.uploadedAudioFilename.replace('.mp3', '')}.webm`)
    this.uploadVideo({
      blob: data,
      title,
    })
  }

  async uploadVideo(payload) {
    this.setState({
      working: false,
      preparing: true
    })
    await axios.post("http://localhost:8000/uploadRender", payload.blob)
    .then(res => {
      // Download when all done
      this.downloadVideo(res, payload.title)
    })
  }

  downloadVideo(res, title) {
    var a = document.createElement('a');
    a.href = 'http://localhost:8000/download/' + res.data.filename
    a.download = `${title}.mp4`
    a.click();
    this.setState({
      preparing: false,
    })
    // Clear the state and reset dropzone
    this.resetAll()
  }

  resetAll() {
    this.setState = {
      showHelp: true,
      analysing: false,
      working: false,
      preparing: false,
      uploadedAudioFilename: null,
      tags: {
        album: 'Unknown',
        artist: 'Unknown',
        title: 'Unknown',
        genre: 'Unknown',
        year: 'Unknown',
      }
    }
    this.wavesurfer.empty()
  }

  render() {
    const { format, elements } = this.props
    const { showHelp, duration, working, preparing, analysing } = this.state
    const length = (duration / 60).toFixed(1)
    const { album, artist, title, genre, year } = this.state.tags

    return (
      <div
        className='waveformContainer'
        style={{
          width: `${format.width/2}px`,
          height: `${format.height/2}px`
        }}
      >
        <div className="dropzoneContainer">
          <Dropzone
            accept='audio/mp3, audio/wav'
            onDrop={this.handleDropFile.bind(this)}
          >
            {({getRootProps, getInputProps, isDragActive, isDragReject}) => (
              <div className="dropzoneContainer" {...getRootProps()}>
                <input {...getInputProps()} />
                { analysing && <div className="dropzoneInfo">
                  <p>Analysing..</p>
                </div> }
                { showHelp && !isDragActive && <div className="dropzoneInfo">
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
            )}
          </Dropzone>
        </div>
        <div className="info">
          { elements.artist && artist && <h2>{artist}</h2> }
          { elements.album && album && <h1>{album}</h1> }
          { elements.title && title && <h1>"{title}"</h1> }
          <p>{ elements.genre && genre && genre} { year && year }</p>
          { preparing && <div className="dropzoneInfo withoverlay">
            <p>Preparing download</p>
          </div> }
        </div>
        <div className='waveform'>
          <div className='wave'></div>
        </div>
        <div className="buttons">
          { length > 1 &&
            <button
              className="generate"
              style={{ background: (working || preparing) && 'transparent' }}
              onClick={() => {
              this.exportFrames()
            }}>{!working && !preparing ? 'Create' : 'Working..'}</button>
          }
          <button onClick={this.resetAll.bind(this)}>Reset</button>
        </div>
      </div>
    )
  }
}

export default Waveform;