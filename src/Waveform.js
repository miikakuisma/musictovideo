import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
import Dropzone from 'react-dropzone'
import domtoimage from 'dom-to-image'
import Editor from './Editor/'
import { Pane, Heading, FilePicker, Button, toaster, Spinner, Icon } from 'evergreen-ui'
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
      preparing: false,
      showCover: false,
      showEditor: false,
      showHelp: true,
      coverImage: null,
      tags: {},
      uploadedAudioFilename: null,
      uploadProgress: null,
      uploadTotal: null,
      working: false,
      waveStyle: {
        width: 1280,
        height: 360,
        barWidth: 2,
        barHeight: 1,
        normalize: true,
        barGap: 1,
        cursorWidth: 2,
        pixelRatio: 2,
        progressColor: 'rgba(255, 255, 255, 1)',
        waveColor: 'rgba(255, 255, 255, 0.6)',
        cursorColor: 'transparent',
        responsive: true,
        backend: 'WebAudio',
      },
      theme: {
        colorTop: '#000333',
        colorBottom: '#3f4c6b'
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
      // Initialize wave surfer
      setTimeout(() => {
        this.wavesurfer = !this.wavesurfer ? WaveSurfer.create({
          container: document.querySelector('.waveform'),
          ...this.state.waveStyle
        }) : this.wavesurfer
        this.wavesurfer.on('loading', () => {
          // this.setState({ analysing: true })
        })
        this.wavesurfer.on('ready', () => {
          this.setState({
            // analysing: false,
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
    this.setState({
      working: true,
      showEditor: false,
    })
    this.frame = 1
    this.exportedImages = []
    this.exportTimer = setInterval(() => {
      if (this.frame <= (this.state.duration * FPS)) {
        const nextFrame = 1/(this.state.duration * FPS) * this.frame
        this.seekTo(nextFrame, () => {
          domtoimage.toPng(document.querySelector(".waveformContainer"), {
            quality: 0.8,
            width: 1280,
            height: 720
          })
            .then((dataUrl) => {
              this.exportedImages.push(dataUrl)
              this.setState({
                currentFrame: this.frame + 1,
              })
              this.frame++
            })
        })
      } else {
        clearInterval(this.exportTimer)
        this.setState({ working: false })
        // Merge exported images into video
        this.mergeFrames()
      }  
    }, 300)
  }

  seekTo(duration, callback) {
    this.wavesurfer.seekTo(duration)
    callback()
  }

  async mergeFrames() {
    this.setState({
      working: false,
      preparing: true
    })
    toaster.success('Almost done!', {
      description: 'Adding finishing touch...'
    })
    const timestamp = Date.now()
    this.exportedImages.forEach(async (image, index) => {
      const filename = timestamp + '-frame' + (1000 + index) + '.png'
      var blob = this.dataURLtoFile(image, filename)            
      var formData = new FormData();
      formData.append('file', blob, filename);
      await axios.post(APIURL + "uploadFrames", formData)
    })
    await axios({
      url: APIURL + "mergeFrames",
      method: 'post',
      params: {
        fps: FPS,
        timestamp,
        audiofile: this.state.uploadedAudioFilename,
        frames: this.exportedImages.length
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
    // a.click();
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
    const { working, preparing, uploadTotal, uploadProgress } = this.state
    if (working) {
      return 'Rendering...'
    } else if (preparing) {
      return `Compressing...` // ${Math.floor((100/uploadTotal) * uploadProgress - 1)}%
    }
    else {
      return 'Now Make it!'
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

  render() {
    const {
      downloadLink,
      currentFrame,
      duration,
      coverImage,
      error,
      preparing,
      showCover,
      showEditor,
      showHelp,
      working,
      theme,
      tags,
    } = this.state
    const length = (duration / 60).toFixed(1)
    const { album, artist, title } = this.state.tags

    const progress = Math.floor((100/Math.floor(duration * FPS)) * currentFrame)

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
              text={`${progress}%`}
              circleRatio={0.75}
              styles={buildStyles({
                rotation: 1 / 2 + 1 / 8,
                strokeLinecap: "butt",
                trailColor: "#eee"
              })}
            />
            <span style={{ marginTop: '-40px' }}>Creating your video</span>
          </Pane>
        </div> }

        { !showHelp && <Pane
          elevation={2}
          display="flex"
          padding={30}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          marginBottom={30}
          style={{
            boxShadow: working && 'none'
          }}
        >
          <Heading size={500} >Preview</Heading>
          <div
            className='waveformContainer'
            style={{
              width: `1280px`,
              height: `720px`,
              zoom: working ? '1' : '0.5',
              background: showHelp ? '#333' : `linear-gradient(to bottom, ${theme.colorTop} 0%,${theme.colorBottom} 100%)`
            }}
          >
            <Pane>
              { showCover && <div className="cover" style={{ backgroundImage: `url(${coverImage})` }}>
                <input
                  type="file"
                  style={{
                    opacity: coverImage ? '0' : '1'
                  }}
                  onChange={this.handleDropCover.bind(this)}
                />
              </div> }
              <div className="info">           
                { artist && <h2>{artist}</h2> }
                { title && <h1>"{title}"</h1> }
                <p>{ album && album }</p>
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
                appearance={showEditor ? "default" : "primary"}
                intent="none"
                iconBefore="cog"
                disabled={working || preparing}
                onClick={() => {
                  this.setState({ showEditor: !showEditor })
                  this.wavesurfer.seekTo(!showEditor ? 0.3 : 0)
                }}
              >Options</Button>
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
              width="33%"
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

        { showEditor && <Editor
          theme={theme}
          showCover={showCover}
          tags={tags}
          onUpdate={(newValues) => { this.setState(newValues) }}
          onUpdateWaveColor={(newColor) => {
            this.wavesurfer.setProgressColor(newColor)
          }}
        /> }
      </Pane>
    )
  }
}

export default Waveform;