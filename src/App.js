import React from 'react'
import { isChromium, isOpera, isChrome, isTablet, isMobile } from "react-device-detect";
import { Pane, Alert } from 'evergreen-ui'
import Waveform from './Waveform'
import './App.css'

const APIURL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/' : 'http://142.93.173.43:5000/'

const waveStyle = {
  width: 1280,
  height: 360,
  barWidth: 1,
  barGap: 0,
  cursorWidth: 2,
  pixelRatio: 2,
  progressColor: 'rgba(255, 255, 255, 1)',
  waveColor: 'rgba(255, 255, 255, 0.6)',
  cursorColor: 'transparent',
  responsive: true,
  backend: 'WebAudio',
}

const outputFormats = [
  {
    name: '360p',
    value: 360,
    size: {
      width: 640,
      height: 360
    }    
  },
  {
    name: '480p',
    value: 480,
    size: {
      width: 850,
      height: 480
    }
  },
  {
    name: '720p',
    value: 720,
    size: {
      width: 1280,
      height: 720
    }    
  },
  {
    name: '1080p',
    value: 1080,
    size: {
      width: 1920,
      height: 1080
    }    
  }
]

const elements = {
  artist: true,
  album: true,
  title: true,
  genre: false,
  year: false
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedFormat: 720,
      data: null,
      error: null
    }
  }

  componentDidMount() {
    this.callBackendAPI()
      .then(res => this.setState({ data: res.express }))
      .catch(err => {
        this.setState({ error: 'Could not connect to server' })
      });
  }

  async callBackendAPI () {
    const response = await fetch(APIURL + 'express_backend');
    const body = await response.json();

    if (response.status !== 200) {
      this.setState({ error: 'Could not connect to server' })
      throw Error(body.message) 
    }
    return body;
  };

  handleFormatChange(event) {
    console.log('event.target.value', event.target.value)
    this.setState({ selectedFormat: parseInt(event.target.value) })
  }

  render() {
    const { selectedFormat, error } = this.state

    // const formatOptions = outputFormats.map((format, index) => <option
    //   key={index}
    //   value={format.value}
    // >{format.name}</option>)

    // console.log('selectedFormat', selectedFormat)
    // console.log('outputFormats', outputFormats.find(format => format.value === selectedFormat).size)
    const browserSupported = true // (isChrome || isChromium || isOpera) && (!isTablet || !isMobile)

    // If browser not supported, show alert screen
    if (!browserSupported) {
      return (<Pane clearfix>
        <Pane
          elevation={1}
          width={window.innerWidth}
          height={window.innerHeight}
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          backgroundColor="white"
        >
        <Alert
          intent="danger"
          title="Your browser is not supported. Please use desktop Chrome (or Chromium based) or Opera browser. We will soon support other browsers too."
        />
        </Pane>
      </Pane>)
    }

    // Otherwise start the app
    return (
      <Pane clearfix>
        <Pane
          elevation={1}
          width={window.innerWidth}
          height={window.innerHeight}
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          backgroundColor="white"
        >
          {!error ? <Waveform
            theme={waveStyle}
            format={outputFormats.find(format => format.value === selectedFormat).size}
            elements={elements}
          /> : <h1 style={{ color: 'white' }}>{error}</h1> }
          {/*<div className="formatSelector">
            <select
              defaultValue={selectedFormat}
              onChange={this.handleFormatChange.bind(this)}
            >
              {formatOptions}
            </select>
          </div>*/}
        </Pane>
      </Pane>
    )
  }
}

export default App;