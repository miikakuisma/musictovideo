import React from 'react'
import PropTypes from 'prop-types'

const fabric = window.fabric

class Elements extends React.Component {
  static propTypes = {
    canvas: PropTypes.object,
    waveform: PropTypes.string.isRequired,
    waveformTop: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
  }

  static defaultProps = {
    progress: 0,
  }

  componentDidUpdate() {
    const { text, progress } = this.props

    window.canvas.clear()
 
    this.props.canvas.add(new fabric.IText(text, {
      fontFamily: 'Helvetica',
      left: 960,
      top: 200,
      fontSize: 64,
      fill: 'white',
      textAlign: 'center',
      hasControls: true,
      hasRotatingPoint: false,
      originX: 'center',
      shadow: 'rgba(0,0,0,0.3) 5px 5px 5px',
    }))

    const clipPath = new window.fabric.Rect(({
      left: -960,
      top: -540,
      width: 1920/100 * progress,
      height: 1080,
    }))

    fabric.Image.fromURL(this.props.waveform, img => {
      img.set({ top: this.props.waveformTop })
      img.lockMovementX = true
      img.hasControls = false
      img.filters.push(new fabric.Image.filters.Brightness({
        brightness: -1
      }));
      img.applyFilters()
      this.props.canvas.add(img)
      img.sendToBack()
    })

    fabric.Image.fromURL(this.props.waveform, img => {
      img.set({ top: this.props.waveformTop })
      img.lockMovementX = true
      img.hasControls = false
      img.clipPath = clipPath
      img.filters.push(new fabric.Image.filters.Brightness({
        brightness: 2
      }));
      img.applyFilters()
      this.props.canvas.add(img)
      img.bringToFront()
    })
  }

  render() {
    return null
  }
}

export default Elements
