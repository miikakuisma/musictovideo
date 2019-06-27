import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
import Dropzone from 'react-dropzone'
import { Pane, Heading, FilePicker, Button, toaster, Spinner, Select, TextInputField } from 'evergreen-ui'

import './waveform.css'
var html2canvas = require('html2canvas')

let FPS = 2

const APIURL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/' : 'http://dev.moreyes.fi:5000/'

class Waveform extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      analysing: false,
      currentFrame: null,
      currentTime: null,
      downloadLink: null,
      duration: null,
      error: null,
      preparing: false,
      showEditor: false,
      showHelp: true,
      tags: {},
      uploadedAudioFilename: null,
      uploadProgress: null,
      uploadTotal: null,
      working: false,
    }
  }

  componentDidMount() {
    return
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
      // Initialize wave surfer
      setTimeout(() => {
        this.wavesurfer = !this.wavesurfer ? WaveSurfer.create({
          container: document.querySelector('.waveform'),
          ...this.props.theme
        }) : this.wavesurfer
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
        this.loadSound(acceptedFiles[0])
      }, 1000)
      // Upload the file for later processing
      const data = new FormData() 
      data.append('file', acceptedFiles[0])
      axios.post(APIURL + "uploadMusic", data)
      .then(res => {
        if (res.statusText === 'OK') {
          toaster.success('Your file has been uploaded.', {
            description: 'We will attach it into the video'
          })
          _this.setState({ uploadedAudioFilename: res.data.filename })
        } else {
          _this.setState({ error: 'Something went wrong..' })
        }
      })
      .catch(error => {
        console.log(error)
        _this.setState({ error: 'Could not connect to server..' })
      });
    }
  }

  readTags(file) {
    // Read MP3 ID3 tags and set them to state
    var jsmediatags = require("jsmediatags");
    jsmediatags.read(file, {
      onSuccess: (tag) => {
        this.setState({
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

  loadSound(file) {
    // Analyse waveform
    this.wavesurfer.loadBlob(file)
    // Read tags
    this.readTags(file)
  }

  exportFrames() {
    this.setState({
      working: true,
      showEditor: false,
    })
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
      const timestamp = Date.now()
      const data = new FormData()
      data.append('file', blob, `${timestamp}${this.state.uploadedAudioFilename.replace('.mp3', '')}.webm`)
      this.uploadVideo({
        blob: data,
        title,
      })
    } else {
      toaster.warning('We are still waiting for your file to get fully uploaded.', {
        description: 'We will finish making your video once it has been uploaded.'
      })
      this.waitingTimer = setTimeout(() => {
        this.compressWhenReady(blob)
      }, 1000)
    }
  }

  async uploadVideo(payload) {
    this.setState({
      working: false,
      preparing: true
    })
    const config = {
      onUploadProgress: (progressEvent) => {
        this.setState({
          uploadProgress: progressEvent.loaded,
          uploadTotal: progressEvent.total
        })
      }
    }
    toaster.notify('Getting ready for final magic')
    await axios.post(APIURL + "uploadRender", payload.blob, config)
    .then(res => {
      this.setState({
        uploadProgress: null,
        uploadTotal: null
      })
      toaster.success('Your video has been created!', {
        description: 'Download button should appear about right now'
      })
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
    console.log(this.state.downloadLink)
  }

  getButtonText() {
    const { working, preparing, uploadTotal, uploadProgress } = this.state
    if (working) {
      return 'Creating...'
    } else if (preparing) {
      return `Compressing ${Math.floor((100/uploadTotal) * uploadProgress - 1)}%`
    }
    else {
      return 'Now Make it!'
    }
  }

  render() {
    const { format, elements } = this.props
    const {
      analysing,
      downloadLink,
      duration,
      error,
      preparing,
      showEditor,
      showHelp,
      working,
    } = this.state
    const length = (duration / 60).toFixed(1)
    const { album, artist, title, genre, year } = this.state.tags

    return (
      <Pane clearfix>
        { showHelp && <Heading
          display="flex"
          size={800}
          marginBottom={30}
          justifyContent="center"
        >Music to Video</Heading>}
        { showHelp && <Pane
          elevation={1}
          display="flex"
          padding={30}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          background="blueTint"
          marginBottom={30}
        >
          <Heading size={500} marginBottom={10}>Select .MP3 file from your computer</Heading>
          <FilePicker
            accept={'audio/mp3'}
            disabled={working || preparing}
            onChange={this.handleDropFile.bind(this)}
          />
        </Pane> }
        { showHelp && <Dropzone
          accept='audio/mp3'
          onDrop={this.handleDropFile.bind(this)}
        >
          {({getRootProps, getInputProps, isDragActive, isDragReject}) => (
            <div className="dropzoneContainer" {...getRootProps()}>
              <input {...getInputProps()} />
              { !isDragActive && <div className="dropzoneInfo">
                <div className="icon add" />
                <p>or drop .MP3 file here</p>
              </div> }
              { isDragActive && !isDragReject && <div className="dropzoneInfo">
                <div className="icon check" />
                <p>Looking good!</p>
              </div> }
              { isDragReject && <div className="dropzoneInfo">
                <div className="icon reject" />
                <p>File type not accepted, sorry!</p>
              </div> }
              { analysing && <div className="dropzoneInfo">
                <p>Analysing..</p>
              </div> }
            </div>
          )}
        </Dropzone> }
        { !showHelp && <Pane
          elevation={2}
          display="flex"
          padding={30}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          backgroundColor="tint1"
          marginBottom={30}
        >
          <Heading size={500} >Preview</Heading>
          <div
            className='waveformContainer'
            style={{
              width: `${format.width/2}px`,
              height: `${format.height/2}px`,
              background: showHelp ? '#333' : 'linear-gradient(to bottom, #000333 0%,#3f4c6b 100%)'
            }}
          >
            <Pane>
              <div className="info">
                { elements.artist && artist && <h2>{artist}</h2> }
                { elements.title && title && <h1>"{title}"</h1> }
                <p>{ elements.album && album } { elements.genre && genre} { year && year }</p>
              </div>
              <div className='waveform'>
                <div className='wave'></div>
              </div> 
            </Pane>
          </div>

          { length > 1 && !error && <Pane
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Pane width="33%">
              <Button
                appearance="default"
                intent="none"
                iconBefore="cog"
                disabled={working || preparing}
                onClick={() => { this.setState({ showEditor: !showEditor })}}
              >Customize</Button>
              <Select
                disabled
                marginLeft={10}
                onChange={event => console.log(event.target.value)}
              >
                <option value="720" selected>720p</option>
              </Select>
            </Pane>
            { !downloadLink && (working || preparing) && <Pane
              width="33%"
              display="flex"
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
            >
              <Spinner />
            </Pane> }
            <Pane
              alignItems="center"
              justifyContent="right"
            >
              { !downloadLink && <Button
                className="generate"
                width="100%"
                height={60}
                disabled={working || preparing}
                appearance="primary"
                intent="success"
                iconBefore={ working || preparing ? null : "endorsed" }
                onClick={() => {
                  this.exportFrames()
                }}
              >{this.getButtonText()}</Button> }
              { downloadLink && <Button
                className="download"
                width="100%"
                height={60} 
                appearance="primary"
                intent="success"
                iconBefore="download"
                onClick={() => {
                  window.open(downloadLink)
                }}
              >Download Video</Button> }
            </Pane>
          </Pane> }
        </Pane> }

        { showEditor && <Pane
          elevation={1}
          display="flex"
          padding={30}
          width={700}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          backgroundColor="tint1"
          marginBottom={30}
        >
          <TextInputField
            label="Artist"
            defaultValue={artist}
            onChange={(e) => {
              this.setState({ tags: {...this.state.tags, artist: e.target.value} })
            }}
          />
          <TextInputField
            label="Title"
            defaultValue={title}
            onChange={(e) => {
              this.setState({ tags: {...this.state.tags, title: e.target.value} })
            }}
          />
          <TextInputField
            label="Album"
            defaultValue={album}
            onChange={(e) => {
              this.setState({ tags: {...this.state.tags, album: e.target.value} })
            }}
          />
          <TextInputField
            label="Genre"
            defaultValue={genre}
            onChange={(e) => {
              this.setState({ tags: {...this.state.tags, genre: e.target.value} })
            }}
          />
          <TextInputField
            label="Year"
            defaultValue={year}
            onChange={(e) => {
              this.setState({ tags: {...this.state.tags, year: e.target.value} })
            }}
          />
        </Pane> } 
      </Pane>
    )
  }
}

export default Waveform;