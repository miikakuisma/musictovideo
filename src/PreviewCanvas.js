import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

const fabric = window.fabric

class PreviewCanvas extends React.Component {
  // static propTypes = {
  //   width: PropTypes.number.isRequired,
  //   height: PropTypes.number.isRequired,
  // }

  // static defaultProps = {
  //   width: 1920,
  //   height: 1080,
  // }

  state = {
    canvas: null,
  }

  componentDidUpdate() {
    window.canvas.set({
      backgroundImage: fabric.Image.fromURL('bgr.jpg')
    })
    fabric.Image.fromURL('bgr.jpg', function(img) {
      // add background image
      window.canvas.setBackgroundImage(img, () => {
        window.canvas.renderAll.bind(window.canvas)
        window.canvas.setWidth(1920)
        window.canvas.setHeight(1080)
      });
    });
  }

  componentDidMount() {
    window.canvas = new fabric.Canvas(this.c)
    this.setState({ canvas: window.canvas })    
  }

  render() {
    const children = React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        canvas: this.state.canvas,
      })
    })
    return (
      <Fragment>
        <canvas ref={c => (this.c = c)} width="1920" height="1080" />
        {this.state.canvas && children}
      </Fragment>
    )
  }
}

export default PreviewCanvas