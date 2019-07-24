import React from 'react'
import { SwatchesPicker } from 'react-color'
import { Pane, Heading, TextInputField, Switch, Select } from 'evergreen-ui'
import './editor.css'

class Editor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      coverImage: null,
      showTopColorPicker: false,
      showWaveColorPicker: false,
      showProgressColorPicker: false,
      showBottomColorPicker: false
    }
  }

  handleDropCover(e) {
    var reader = new FileReader()
    const _this = this
    reader.onload = function (event) {
      _this.setState({ coverImage: event.target.result })
    }
    if (e.target.files.length > 0) {
      reader.readAsDataURL(e.target.files[0])
    }
  }

  render() {
    const {
      showTopColorPicker,
      showWaveColorPicker,
      showProgressColorPicker,
      showBottomColorPicker
    } = this.state
    const { theme, showCover } = this.props
    const { album, artist, title } = this.props.tags

    return (
      <div>
        <Pane
          elevation={0}
          display="flex"
          padding={10}
          width={250}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          backgroundColor="#F5F6F7"
          marginBottom={30}
          style={{
            position: 'absolute',
            width: '160px',
            top: '45px',
            right: '-161px',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column'
          }}
        >
          <div className="section">
            <Heading size={500} marginBottom={10}>Top Color</Heading>
            <div
              className='colorPickerToggle'
              style={{
                border: showBottomColorPicker ? '1px solid #ccc' : '1px solid transparent',
                backgroundColor: theme.colorTop
              }}
              onClick={() => {
                this.setState({ showTopColorPicker: !showTopColorPicker })
              }}
            />
            { showTopColorPicker && <SwatchesPicker
              color={theme.colorTop}
              onChangeComplete={(color) => {
                this.props.onUpdate({ theme: {...theme, colorTop: color.hex} })
              }}
            /> }
          </div>

          <div className="section">
            <Heading size={500} marginBottom={10}>Wave Color</Heading>
            <div
              className='colorPickerToggle'
              style={{
                border: showWaveColorPicker ? '1px solid #ccc' : '1px solid transparent',
                backgroundColor: theme.waveColor
              }}
              onClick={() => {
                this.setState({ showWaveColorPicker: !showWaveColorPicker })
              }}
            />
            { showWaveColorPicker && <SwatchesPicker
              color={theme.colorTop}
              onChangeComplete={(color) => {
                this.props.onUpdateWaveColor(color.hex)
              }}
            /> }
          </div>

          <div className="section">
            <Heading size={500} marginBottom={10}>Progress Color</Heading>
            <div
              className='colorPickerToggle'
              style={{
                border: showBottomColorPicker ? '1px solid #ccc' : '1px solid transparent',
                backgroundColor: theme.progressColor
              }}
              onClick={() => {
                this.setState({ showProgressColorPicker: !showProgressColorPicker })
              }}
            />
            { showProgressColorPicker && <SwatchesPicker
              color={theme.colorTop}
              onChangeComplete={(color) => {
                this.props.onUpdateProgressColor(color.hex)
              }}
            /> }
          </div>

          <div className="section">
            <Heading size={500} marginBottom={10}>Bottom Color</Heading>
            <div
              className='colorPickerToggle'
              style={{
                border: showBottomColorPicker ? '1px solid #ccc' : '1px solid transparent',
                backgroundColor: theme.colorBottom
              }}
              onClick={() => {
                this.setState({ showBottomColorPicker: !showBottomColorPicker })
              }}
            />
            { showBottomColorPicker && <SwatchesPicker
              color={theme.colorBottom}
              onChangeComplete={(color) => {
                this.props.onUpdate({ theme: {...theme, colorBottom: color.hex} })
              }}
            /> }
          </div>
        </Pane>

        <Pane
          elevation={0}
          display="flex"
          padding={30}
          width={250}
          justifyContent="left"
          alignItems="left"
          flexDirection="column"
          backgroundColor="#F5F6F7"
          marginBottom={30}
          style={{
            position: 'absolute',
            width: '250px',
            top: '30px',
            left: '-251px',
          }}
        >
          <TextInputField
            label="Artist"
            defaultValue={artist}
            onChange={(e) => {
              this.props.onUpdate({ tags: {...this.props.tags, artist: e.target.value} })
            }}
          />
          <TextInputField
            label="Title"
            defaultValue={title}
            onChange={(e) => {
              this.props.onUpdate({ tags: {...this.props.tags, title: e.target.value} })
            }}
          />
          <TextInputField
            label="Album"
            defaultValue={album}
            onChange={(e) => {
              this.props.onUpdate({ tags: {...this.props.tags, album: e.target.value} })
            }}
          />
          <Pane marginBottom={30}>
            <Heading size={400}>Cover image</Heading>
            <Switch
              height={24}
              checked={showCover}
              onChange={() => {
                this.props.onUpdate({ showCover: !showCover })
              }}
            />
          </Pane>
          <Pane marginBottom={30} alignItems="left" justifyContent="left">
            <Heading size={400}>Output format</Heading>
            <Select
              disabled
              defaultValue={720}
              onChange={event => console.log(event)}
            >
              <option>MP4 / 720p</option>
            </Select>
            <Select
              disabled
              marginLeft={10}
              onChange={event => console.log(event)}
            >
              <option>2 FPS</option>
            </Select>
          </Pane>
        </Pane>
      </div>
    )
  }
}

export default Editor;