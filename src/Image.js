import React from 'react'
import PropTypes from 'prop-types'

const fabric = window.fabric

class Image extends React.Component {
  static propTypes = {
    canvas: PropTypes.object,
    url: PropTypes.string.isRequired,
    scale: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    progress: PropTypes.number.isRequired,
  }

  static defaultProps = {
    scale: 1.0,
  }

  componentDidUpdate() {
    const { progress } = this.props

    const clipPath = new window.fabric.Rect(({
      left: -960,
      top: -540,
      width: 1920/100 * progress,
      height: 1080,
    }))

    this.props.canvas.clear()
    
    fabric.Image.fromURL(this.props.url, img => {
      img.scale(this.props.scale)
      img.set({ top: this.props.top })
      img.lockMovementX = true
      img.clipPath = clipPath
      this.props.canvas.add(img)
    })
  }

  render() {
    return null
  }
}

export default Image
