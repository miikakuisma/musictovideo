import React from 'react'
import Waveform from './Waveform'
import './App.css'

const waveStyle = {
  barWidth: 1,
  barGap: 0,
  cursorWidth: 2,
  backend: 'WebAudio',
  width: 640,
  height: 100,
  progressColor: '#ffc107',
  responsive: true,
  waveColor: '#fff',
  cursorColor: 'transparent',
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
  genre: true
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedFormat: 720,
      data: null
    }
  }

  componentDidMount() {
    this.callBackendAPI()
      .then(res => this.setState({ data: res.express }))
      .catch(err => console.log(err));
  }

  async callBackendAPI () {
    const response = await fetch('/express_backend');
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message) 
    }
    return body;
  };

  handleFormatChange(event) {
    console.log('event.target.value', event.target.value)
    this.setState({ selectedFormat: parseInt(event.target.value) })
  }

  render() {
    const { selectedFormat } = this.state

    // const formatOptions = outputFormats.map((format, index) => <option
    //   key={index}
    //   value={format.value}
    // >{format.name}</option>)

    // console.log('selectedFormat', selectedFormat)
    // console.log('outputFormats', outputFormats.find(format => format.value === selectedFormat).size)

    return (
      <div className="appContainer">
        <Waveform
          theme={waveStyle}
          format={outputFormats.find(format => format.value === selectedFormat).size}
          elements={elements}
        />
        {/*<div className="formatSelector">
          <select
            defaultValue={selectedFormat}
            onChange={this.handleFormatChange.bind(this)}
          >
            {formatOptions}
          </select>
        </div>*/}
      </div>
    )
  }
}

export default App;