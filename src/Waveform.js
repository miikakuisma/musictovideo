import React from 'react'
import axios from 'axios'
import WaveSurfer from 'wavesurfer.js'
import Dropzone from 'react-dropzone'
import domtoimage from 'dom-to-image'
import { SwatchesPicker } from 'react-color'
import { Pane, Heading, FilePicker, Button, toaster, Spinner, Select, TextInputField, Icon, Switch } from 'evergreen-ui'
import './waveform.css'

let FPS = 2

const APIURL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/' : 'http://142.93.173.43:5000/'

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
      showCover: false,
      showEditor: false,
      showHelp: true,
      coverImage: null,
      tags: {},
      uploadedAudioFilename: null,
      uploadProgress: null,
      uploadTotal: null,
      working: false,
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
        this.wavesurfer.seekTo(nextFrame)
        domtoimage.toPng(document.querySelector(".waveformContainer"), {
          quality: 1,
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
      } else {
        clearInterval(this.exportTimer)
        this.setState({ working: false })
        // Merge exported images into video
        this.mergeFrames()
      }  
    })
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
    const { format, elements } = this.props
    const {
      analysing,
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
      showTopColorPicker,
      showBottomColorPicker
    } = this.state
    const length = (duration / 60).toFixed(1)
    const { album, artist, title, genre, year } = this.state.tags

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
              { analysing && <div className="dropzoneInfo">
                <p>Analysing..</p>
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
            <Spinner />
            <br/>
            <span>{Math.floor((100/Math.floor(duration * FPS)) * currentFrame)}%</span>
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
        >
          <Heading size={500} >Preview</Heading>
          <div
            className='waveformContainer'
            style={{
              width: `${format.width}px`,
              height: `${format.height}px`,
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
                { elements.artist && artist && <h2>{artist}</h2> }
                { elements.title && title && <h1>"{title}"</h1> }
                <p>{ elements.album && album } { elements.genre && genre} { elements.year && year }</p>
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
                onClick={() => { this.setState({ showEditor: !showEditor })}}
              >Options</Button>
              <Select
                disabled
                marginLeft={10}
                defaultValue={720}
                onChange={event => console.log(event.target.value)}
              >
                <option value="720">720p</option>
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

        { showEditor && <Pane
          elevation={0}
          display="flex"
          padding={30}
          width={250}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          backgroundColor="#F5F6F7"
          marginBottom={30}
          style={{
            position: 'absolute',
            width: '160px',
            top: '45px',
            right: '-161px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Heading size={500}>Top Color</Heading>
          <div
            className='colorPickerToggle'
            style={{ border: showBottomColorPicker ? '1px solid #ccc' : '1px solid transparent' }}
            onClick={() => {
              this.setState({ showTopColorPicker: !showTopColorPicker })
            }}
          />
          { showTopColorPicker && <SwatchesPicker
            color={theme.colorTop}
            onChangeComplete={(color) => {
              this.setState({ theme: {...this.state.theme, colorTop: color.hex} })
            }}
          /> }
        </Pane> }

        { showEditor && <Pane
          elevation={0}
          display="flex"
          padding={30}
          width={250}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          backgroundColor="#F5F6F7"
          marginBottom={30}
          style={{
            position: 'absolute',
            width: '160px',
            top: '335px',
            right: '-161px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Heading size={500}>Bottom Color</Heading>
          <div
            className='colorPickerToggle'
            style={{ border: showBottomColorPicker ? '1px solid #ccc' : '1px solid transparent' }}
            onClick={() => {
              this.setState({ showBottomColorPicker: !showBottomColorPicker })
            }}
          />
          { showBottomColorPicker && <SwatchesPicker
            color={theme.colorBottom}
            onChangeComplete={(color) => {
              this.setState({ theme: {...this.state.theme, colorBottom: color.hex} })
            }}
          /> }
        </Pane> }

        { showEditor && <Pane
          elevation={0}
          display="flex"
          padding={30}
          width={250}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          backgroundColor="#F5F6F7"
          marginBottom={30}
          style={{
            position: 'absolute',
            width: '250px',
            top: '30px',
            left: '-251px',
          }}
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
          <Pane>
            <Heading size={400}>Cover image</Heading>
            <Switch
              height={24}
              checked={showCover}
              onChange={() => {
                this.setState({ showCover: !showCover })
              }}
            />
          </Pane>
          {/*<TextInputField
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
          />*/}
        </Pane> } 
      </Pane>
    )
  }
}

export default Waveform;