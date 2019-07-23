import React from 'react'
// import { isChromium, isOpera, isChrome, isTablet, isMobile } from "react-device-detect";
import { Pane } from 'evergreen-ui'
import Waveform from './Waveform'
import './App.css'

const APIURL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/' : 'http://142.93.173.43:5000/'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
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
    const { error } = this.state

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
          {!error ? <Waveform /> : <h1 style={{ color: 'white' }}>{error}</h1> }
        </Pane>
      </Pane>
    )
  }
}

export default App;