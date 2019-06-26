import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
import Dropzone from 'react-dropzone'
import './waveform.css'
var html2canvas = require('html2canvas')

let FPS = 2

const APIURL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/' : 'http://dev.moreyes.fi:5000/'

class Waveform extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      showHelp: true,
      showDetails: false,
      duration: null,
      currentTime: null,
      currentFrame: null,
      analysing: false,
      working: false,
      preparing: false,
      downloadLink: null,
      tags: {},
      uploadedAudioFilename: null,
      error: null
    }
  }

  readTags(file) {
    // Read MP3 ID3 tags and set them to state
    var jsmediatags = require("jsmediatags");
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        this.setState({
          showDetails: true,
          tags: tag.tags
        })
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
      this.setState({
        downloadLink: null,
        uploadedAudioFilename: null
      })
      const _this = this
      this.setState({ showHelp: false })
      this.loadSound(acceptedFiles[0])
      const data = new FormData() 
      data.append('file', acceptedFiles[0])
      axios.post(APIURL + "uploadMusic", data)
      .then(res => {
        console.log(res)
        if (res.statusText === 'OK') {
          _this.setState({ uploadedAudioFilename: res.data.filename })
        } else {
          _this.setState({ error: res.data })
        }
      })
      .catch(error => {
        console.log(error)
        _this.setState({ error: 'Could not connect to server..' })
      });
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
    const blob = window.Whammy.fromImageArray(this.exportedImages, FPS)
    this.compressWhenReady(blob)
  }

  compressWhenReady(blob) {
    const { title } = this.state.tags

    if (this.state.uploadedAudioFilename) {
      clearTimeout(this.waitingTimer)
      console.log('I have everything, lets compress')
      const timestamp = Date.now()
      const data = new FormData()
      data.append('file', blob, `${timestamp}${this.state.uploadedAudioFilename.replace('.mp3', '')}.webm`)
      this.uploadVideo({
        blob: data,
        title,
      })
    } else {
      this.waitingTimer = setTimeout(() => {
        console.log('trying again')
        this.compressWhenReady(blob)
      }, 1000)
    }
  }

  async uploadVideo(payload) {
    console.log('uploading video')
    this.setState({
      working: false,
      preparing: true
    })
    await axios.post(APIURL + "uploadRender", payload.blob)
    .then(res => {
      console.log(res)
      // Download when all done
      this.downloadVideo(res, payload.title)
    })
  }

  downloadVideo(res, title) {
    var a = document.createElement('a');
    a.href = APIURL + 'download/' + res.data.filename
    a.download = `${title}.mp4`
    // a.click();
    this.setState({
      preparing: false,
      downloadLink: APIURL + 'download/' + res.data.filename
    })
  }

  getButtonText() {
    const { working, preparing } = this.state
    if (working) {
      return 'Working...'
    } else if (preparing) {
      return 'Finalising..'
    } else {
      return 'Convert'
    }
  }

  render() {
    const { format, elements } = this.props
    const { showHelp, showDetails, duration, working, preparing, downloadLink, analysing, error } = this.state
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
            accept='audio/mp3'
            onDrop={this.handleDropFile.bind(this)}
          >
            {({getRootProps, getInputProps, isDragActive, isDragReject}) => (
              <div className="dropzoneContainer" {...getRootProps()}>
                <input {...getInputProps()} />
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
                { analysing && <div className="dropzoneInfo">
                  <p>Analysing..</p>
                </div> }
                { error && <div className="dropzoneInfo withoverlay">
                  <p>{error}</p>
                </div> }
              </div>
            )}
          </Dropzone>
        </div>
        <div className="info">
          { elements.artist && artist && <h2>{artist}</h2> }
          { elements.title && title && <h1>"{title}"</h1> }
          <p>{ elements.album && album } { elements.genre && genre} { year && year }</p>
        </div>
        <div className='waveform'>
          <div className='wave'></div>
        </div>
        <div className="buttons">
          { length > 1 && !error &&
            <button
              className="generate"
              style={{ background: (working || preparing) && 'transparent' }}
              onClick={() => {
                this.exportFrames()
              }}
            >{this.getButtonText()}</button>
          }
          { downloadLink && <button
            className="download"
            onClick={() => {
              window.open(downloadLink)
            }}
            >Download Video</button>}
        </div>
        { showDetails && !working && !preparing && <div className="editor">
          <div className="item">
            <label>Artist</label>
            <input
              type="text"
              defaultValue={artist}
              onChange={(e) => {
                this.setState({ tags: {...this.state.tags, artist: e.target.value} })
              }}
            />
          </div>
          <div className="item">
            <label>Title</label>
            <input
              type="text"
              defaultValue={title}
              onChange={(e) => {
                this.setState({ tags: {...this.state.tags, title: e.target.value} })
              }}
            />
          </div>
          <div className="item">
            <label>Album</label>
            <input
              type="text"
              defaultValue={album}
              onChange={(e) => {
                this.setState({ tags: {...this.state.tags, album: e.target.value} })
              }}
            />
          </div>
          <div className="item">
            <label>Genre</label>
            <input
              type="text"
              defaultValue={genre}
              onChange={(e) => {
                this.setState({ tags: {...this.state.tags, genre: e.target.value} })
              }}
            />
          </div>
          <div className="item">
            <label>Year</label>
            <input
              type="text"
              defaultValue={year}
              onChange={(e) => {
                this.setState({ tags: {...this.state.tags, year: e.target.value} })
              }}
            />
          </div>
        </div> }
      </div>
    )
  }
}

export default Waveform;