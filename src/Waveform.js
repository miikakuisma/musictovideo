import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
import Dropzone from 'react-dropzone'
import domtoimage from 'dom-to-image'

import PreviewCanvas from './PreviewCanvas'
import Elements from './Elements'

import Editor from './Editor/'
import { Pane, Heading, FilePicker, Button, toaster, Icon, Spinner, Switch } from 'evergreen-ui'
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import './waveform.css'

let FPS = 2

const APIURL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/' : 'http://142.93.173.43:5000/'

class Waveform extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentFrame: null,
      currentTime: null,
      downloadLink: null,
      duration: null,
      error: null,
      analysing: false,
      waveformImage: null,
      scopeVideo: 'Lifeline.mp4',
      playing: false,
      preparing: false,
      showOverlay: false,
      showCover: false,
      showEditor: false,
      showHelp: true,
      coverImage: null,
      scopeRendered: false,
      tags: {},
      uploadedAudioFilename: null,
      working: false,
      waveStyle: {
        width: 1280,
        height: 360,
        barWidth: 3,
        barHeight: .8,
        normalize: false,
        barGap: 2,
        cursorWidth: 2,
        pixelRatio: 1,
        waveColor: 'rgba(255, 255, 255, 0.6)',
        progressColor: 'rgba(255, 255, 255, 1)',
        cursorColor: 'transparent',
        responsive: true,
        backend: 'WebAudio',
      },
      theme: {
        colorTop: '#000333',
        textColor: 'white',
        colorBottom: '#3f4c6b',
        waveColor: 'rgba(255, 255, 255, 0.6)',
        progressColor: 'rgba(255, 255, 255, 1)',
        backgroundPosition: 'center',
        backgroundSize: 'cover'
      },
      showTopColorPicker: false,
      showBottomColorPicker: false
    }
  }

  handleDropFile(acceptedFiles) {
    if (acceptedFiles.length > 0) {
      this.setState({
        downloadLink: null,
        uploadedAudioFilename: null
      })
      const _this = this
      this.setState({ showHelp: false })
      // // Initialize wave surfer
      setTimeout(() => {
        this.wavesurfer = !this.wavesurfer ? WaveSurfer.create({
          container: document.querySelector('.waveform'),
          ...this.state.waveStyle
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
          _this.setState({
            uploadedAudioFilename: res.data.filename,
            waveformImage: APIURL + "getWaveform/" + res.data.waveform
          })
          this.readTags(acceptedFiles[0])
          console.log(res, this.state.waveformImage)
          toaster.success('Your file has been uploaded.', {
            description: 'We will attach it into the video'
          })
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

  dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  async exportFrames() {
    const shutterSpeed = this.state.showCover ? 300 : 200 // if background image used, interval timer is longer
    this.wavesurfer.stop()
    this.setState({
      working: true,
      showEditor: false,
    })
    this.frame = 1
    this.exportedImages = []
    const timestamp = Date.now()
    this.exportTimer = setInterval(() => {
      if (this.frame <= (this.state.duration * FPS)) {
        const nextFrame = 1/(this.state.duration * FPS) * this.frame
        this.seekTo(nextFrame, () => {
          domtoimage.toJpeg(document.querySelector(".waveformContainer"), {
            quality: 0.8,
            width: 1280,
            height: 720
          })
            .then(async (dataUrl) => {
              const filename = timestamp + '-frame' + (1000 + this.frame) + '.jpg'
              var blob = this.dataURLtoFile(dataUrl, filename)            
              var formData = new FormData();
              formData.append('file', blob, filename);
              this.setState({
                currentFrame: this.frame + 1,
              })
              this.frame++
              axios.post(APIURL + "uploadFrames", formData)
            })
        })
      } else {
        clearInterval(this.exportTimer)
        this.setState({ working: false })
        // Merge exported images into video
        this.mergeFrames(timestamp)
      }  
    }, shutterSpeed)
  }

  seekTo(duration, callback) {
    this.wavesurfer.seekTo(duration)
    callback()
  }

  async mergeFrames(timestamp) {
    this.setState({
      working: false,
      preparing: true
    })
    toaster.success('Almost done!', {
      description: 'Adding finishing touch...'
    })
    await axios({
      url: APIURL + "mergeFrames",
      method: 'post',
      params: {
        fps: FPS,
        timestamp,
        audiofile: this.state.uploadedAudioFilename,
      }
    }).then((response) => {
      this.compressWhenReady(response)
    })
  }

  compressWhenReady(response) {
    const { title } = this.state.tags
    if (this.state.uploadedAudioFilename) {
      clearTimeout(this.waitingTimer)
      toaster.success('Your video has been created!', {
        description: 'Download button should appear about right now'
      })
      // Download when all done
      this.downloadVideo(response, title)
    } else {
      toaster.warning('We are still waiting for your file to get fully uploaded.', {
        description: 'We will finish making your video once it has been uploaded.'
      })
      this.waitingTimer = setTimeout(() => {
        this.compressWhenReady(response)
      }, 1000)
    }
  }

  downloadVideo(res, title) {
    var a = document.createElement('a');
    a.href = APIURL + 'download/' + res.data.filename
    a.download = `${title}.mp4`
    a.click();
    this.setState({
      preparing: false,
      downloadLink: APIURL + 'download/' + res.data.filename
    })
    // Trigger IFTTT webhooks
    // axios.post('https://maker.ifttt.com/trigger/newmusictovideo/with/key/bYoV10h_oGb3qYWMNcRwYl', {
    //   "value1": `${APIURL}download/${res.data.filename}`
    // })
    // console.log(`${APIURL}download/${res.data.filename}`)
    // console.log(this.state.downloadLink)
  }

  getButtonText() {
    const { working, preparing } = this.state
    if (working) {
      return 'Rendering...'
    } else if (preparing) {
      return `Compressing...`
    }
    else {
      return 'Save as Video'
    }
  }

  handleDropCover(e) {
    var reader = new FileReader()
    const _this = this
    reader.onload = function (event) {
      _this.setState({ coverImage: event.target.result })
    }
    if (e.target.files.length > 0) {
      reader.readAsDataURL(e.target.files[0])
    }
  }

  cancel() {
    axios({
      url: APIURL + "cancel",
      method: 'post',
      params: {
        audiofile: this.state.uploadedAudioFilename,
      }
    })
    this.startOver()
  }

  startOver() {
    window.location.reload()
  }

  async createScope() {
    const _this = this
    toaster.success('Scope rendering started', {
      description: 'a moment please...'
    })
    console.log(this.state.uploadedAudioFilename)
    axios.get(APIURL + "renderScope/" + this.state.uploadedAudioFilename)
    .then(res => {
      if (res.statusText === 'OK') {
        _this.setState({ scopeRendered: true })
        console.log(res.data.scopeVideo)
        toaster.success('Scope video ready!', {
          description: 'You should see it appearing in preview now'
        })
      }
    })
    .catch(error => {
      console.log(error)
      this.setState({ error: 'Could not connect to server..' })
    });
  }

  export() {
    this.setState({ progress: 0 })
    window.requestAnimationFrame(this.exportFrame.bind(this));
  }

  exportFrame() {
    const { progress } = this.state
    const frame = window.canvas.toDataURL({
      format: 'jpeg',
      quality: 0.8
    })
    // upload frames..
    this.setState({ progress: progress + 1 })
    if (progress < 100) {
      window.requestAnimationFrame(this.exportFrame.bind(this))
    } else {
      console.log('DONE')
    }
  }

  render() {
    const {
      downloadLink,
      currentFrame,
      duration,
      waveformImage,
      coverImage,
      error,
      analysing,
      uploadedAudioFilename,
      playing,
      preparing,
      showOverlay,
      showCover,
      showEditor,
      showHelp,
      working,
      theme,
      tags,
      scopeRendered
    } = this.state
    const length = (duration / 60).toFixed(1)
    const { album, artist, title } = this.state.tags
    const { textColor, backgroundSize, backgroundPosition } = this.state.theme
    const shutterSpeed = showCover ? 300 : 200 // if background image used, interval timer is longer
    const progress = Math.floor((100/Math.floor(duration * FPS)) * currentFrame)
    const secondsLeft = Math.floor((duration*FPS/(1000/shutterSpeed)) - (currentFrame/5))
    const formatMinutes = Math.floor(secondsLeft / 60)
    const formatSeconds = secondsLeft - (Math.floor(secondsLeft / 60)) * 60
    const timeLeft = `${formatMinutes < 10 ? '0' + formatMinutes : formatMinutes}:${formatSeconds < 10 ? '0' + formatSeconds : formatSeconds}`

    return (
      <Pane clearfix style={{ position: 'relative' }}>
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
                <Icon icon="add" color="muted" size={64} />
                <p>or drop .MP3 file here</p>
              </div> }
              { isDragActive && !isDragReject && <div className="dropzoneInfo">
                <Icon icon="tick-circle" color="success" size={64} />
                <p>Looking good!</p>
              </div> }
              { isDragReject && <div className="dropzoneInfo">
                <Icon icon="ban-circle" color="danger" size={64} />
                <p>Won't eat that, sorry!</p>
              </div> }
            </div>
          )}
        </Dropzone> }

        { working && <div className='curtain'>
          <Pane
            display="flex"
            padding={30}
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
          >
            <CircularProgressbar
              value={progress}
              text={`${timeLeft}`}
              circleRatio={0.75}
              styles={buildStyles({
                rotation: 1 / 2 + 1 / 8,
                strokeLinecap: "butt",
                trailColor: "#eee"
              })}
            />
            <span style={{ marginTop: '-40px' }}>time remaining</span>
          </Pane>
        </div> }

        { !showHelp && <Pane
          elevation={2}
          width={1020}
          height={620}
          display="flex"
          padding={30}
          marginBottom={30}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          style={{
            boxShadow: working && 'none'
          }}
        >
          <Heading size={500} >Preview</Heading>
          <div className="canvasContainer">
            <PreviewCanvas width={1920} height={1080} progress={progress}>
              <Elements
                waveform={waveformImage}
                theme='light'
                waveformTop={480}
                progress={30}
                text={`${artist} - ${title}`}
                showScope={true}
                // showScope={scopeRendered}
                // scopeVideo={uploadedAudioFilename && uploadedAudioFilename.replace('.mp3', '_scope.mp4')}
              />
            </PreviewCanvas>
          </div>
          
          <div className="waveform"></div>

          { length > 1 && !error && <Pane
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            className="buttonContainer"
          >
            <Pane width="50%">
              <Button
                appearance={playing ? "default" : "primary"}
                intent="none"
                marginRight={10}
                iconBefore={playing ? "pause" : "play"}
                disabled={working || preparing}
                onClick={() => {
                  this.setState({ playing: !playing })
                  this.wavesurfer.playPause()
                }}
              >{playing ? "Pause" : "Play"}</Button>
              <Button
                appearance={showEditor ? "default" : "primary"}
                intent="none"
                iconBefore="cog"
                disabled={working || preparing}
                onClick={() => {
                  this.setState({ showEditor: !showEditor })
                  this.wavesurfer.seekTo(!showEditor ? 0.3 : 0)
                }}
              >Options</Button>
              <Switch
                height={24}
                checked={scopeRendered}
                onChange={this.createScope.bind(this)}
              />
            </Pane>
            <Pane
              width="auto"
              alignItems="right"
              justifyContent="right"
            >
              { !downloadLink && <Button
                className="cancel"
                height={60}
                disabled={working || preparing}
                appearance="primary"
                intent="danger"
                iconBefore="trash"
                onClick={() => {
                  this.cancel()
                }}
              /> }
              { downloadLink && <Button
                className="startover"
                height={60}
                appearance="primary"
                intent="none"
                iconBefore="add"
                onClick={() => {
                  this.startOver()
                }}
              /> }
              { !downloadLink && <Button
                className="generate"
                height={60}
                disabled={working || preparing}
                isLoading={working || preparing}
                appearance="primary"
                intent="success"
                iconBefore={ working || preparing ? null : "endorsed" }
                onClick={() => {
                  this.exportFrames()
                }}
              >{this.getButtonText()}</Button> }
              { downloadLink && <Button
                className="download"
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

        { showEditor && <Editor
          theme={theme}
          showCover={showCover}
          showOverlay={showOverlay}
          tags={tags}
          onUpdate={(newValues) => { this.setState(newValues) }}
          onUpdateProgressColor={(newColor) => {
            this.wavesurfer.setProgressColor(newColor)
            this.setState({ theme: {...theme, progressColor: newColor} })
          }}
          onUpdateWaveColor={(newColor) => {
            this.wavesurfer.setWaveColor(newColor)
            this.setState({ theme: {...theme, waveColor: newColor} })
          }}
        /> }
      </Pane>
    )
  }
}

export default Waveform;