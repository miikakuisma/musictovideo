import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

const fabric = window.fabric

class PreviewCanvas extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }

  static defaultProps = {
    width: 1920,
    height: 1080,
  }

  state = {
    canvas: null,
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
    const { width, height } = this.props
    return (
      <Fragment>
        <canvas ref={c => (this.c = c)} width={width} height={height} />
        {this.state.canvas && children}
      </Fragment>
    )
  }
}

export default PreviewCanvas