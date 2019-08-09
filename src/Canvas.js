import React from 'react'
import './Canvas.css'

class Canvas extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      progress: 100
    }
  }

  componentDidMount() {
    window.canvas = new window.fabric.Canvas('c', {
      width: 1920,
      height: 1080,
      backgroundColor: 'rgb(0,0,0)'
    });    
  }

  export() {
    let { progress } = this.state
    this.setState({ progress: 0 })
    console.log(progress)
    for (var i = 0; i < 100; i++) {
      this.setState({ progress: progress++ })
      console.log(progress)
      window.canvas.toDataURL({
        format: 'jpeg',
        quality: 0.8
      })
    }
  }

  render() {
    const { progress } = this.state

    const clipPath = new window.fabric.Rect(({
      left: -960,
      top: -540,
      width: 1920/100 * progress,
      height: 1080,
    }))

    window.fabric.Image.fromURL('output.png', function(img) {
      img.set({ top: 480 })
      img.lockMovementX = true
      img.clipPath = clipPath
      window.canvas.add(img)
    })

    return (<div><canvas
      id="c"
      width="1920"
      height="1080"
      style={{ width: '1920px', height: '1080px' }}
    >
    </canvas><br/><button onClick={() => { this.setState({ progress: 50 }) }}>Export</button></div>)
  }
}

export default Canvas;