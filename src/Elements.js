import React from 'react'
import PropTypes from 'prop-types'

const fabric = window.fabric

const APIURL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/' : 'http://142.93.173.43:5000/'

class Elements extends React.Component {
  static propTypes = {
    canvas: PropTypes.object,
    waveform: PropTypes.string,
    waveformTop: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    theme: PropTypes.string.isRequired,
    showScope: PropTypes.bool.isRequired,
    scopeVideo: PropTypes.string,
  }

  static defaultProps = {
    progress: 0,
  }

  componentDidUpdate() {
    const { text, progress, theme, showScope, scopeVideo } = this.props
    const _this = this

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

    switch (theme) {
      case 'light':
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
        }, { crossOrigin: 'anonymous' })

        fabric.Image.fromURL(this.props.waveform, img => {
          img.set({ top: this.props.waveformTop })
          img.lockMovementX = true
          img.hasControls = false
          img.opacity = 0.5
          img.filters.push(new fabric.Image.filters.Brightness({
            brightness: -1
          }));
          img.applyFilters()
          this.props.canvas.add(img)
          img.sendToBack()
        }, { crossOrigin: 'anonymous' })
      break

      case 'dark':        
      break

      default:
      break
    }


    function getVideoElement(url) {
      var videoE = document.createElement('video');
      videoE.width = 530;
      videoE.height = 298;
      videoE.muted = true;
      videoE.crossOrigin = "anonymous";
      var source = document.createElement('source');
      source.src = url;
      source.type = 'video/mp4';
      videoE.appendChild(source);
      return videoE;
    }

    var url_mp4 = 'http://localhost:3000/getWaveform/Lifeline.mp4';

    var videoE = getVideoElement(url_mp4);
    var fab_video = new fabric.Image(videoE, {
      left: 0,
      top: 0,
      width: 1920,
      height: 480
    });

    this.props.canvas.add(fab_video);
    fab_video.getElement().play();

    fabric.util.requestAnimFrame(function render() {
       _this.props.canvas.renderAll();
       fabric.util.requestAnimFrame(render);
    });

    // if (!showScope) {
        // this.props.canvas.add(new fabric.Image(document.getElementById("scope-video"), {
          // top: _this.props.waveformTop,
          // left: 0,
          // lockMovementX: true,
          // originX: 'center',
          // originY: 'center',
          // objectCaching: false,
          // crossOrigin: 'anonymous'
        // }))
      
      // fabric.Image(video, img => {
      //   img.set({ top: this.props.waveformTop })
      //   img.lockMovementX = true
      //   img.hasControls = false
      //   img.clipPath = clipPath
      //   img.filters.push(new fabric.Image.filters.Brightness({
      //     brightness: 2
      //   }));
      //   img.applyFilters()
        
      //   img.bringToFront()
      // }, { crossOrigin: 'anonymous' })
      
    // }

  }

  render() {
    return null
  }
}

export default Elements
