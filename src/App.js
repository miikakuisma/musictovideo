import React from 'react'
import Waveform from './Waveform'

function App() {
  return (
    <div>
      <Waveform
        src={'lifeline.mp3'}
      />
      <div id="images"></div>
    </div>
  )
}

export default App;