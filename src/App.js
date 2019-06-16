import React from 'react'
import Waveform from './Waveform'
import './App.css'

const waveStyle = {
  barWidth: 1,
  barGap: 1,
  cursorWidth: 2,
  backend: 'WebAudio',
  width: 640,
  height: 100,
  progressColor: '#ffc107',
  responsive: true,
  waveColor: '#fff',
  cursorColor: 'transparent',
}

const format = {
  width: 1280,
  height: 720
}

class App extends React.Component {

  render() {
    return (
      <Waveform
        theme={waveStyle}
        format={format}
      />
    )
  }
}

export default App;