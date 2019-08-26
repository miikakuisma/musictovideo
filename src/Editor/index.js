import React from 'react'
import { SwatchesPicker } from 'react-color'
import { Pane, Heading, TextInputField, Switch, Select, Popover, Button, Text, Icon } from 'evergreen-ui'
import './editor.css'

class Editor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      coverImage: null,
      showTopColorPicker: false,
      showTextColorPicker: false,
      showWaveColorPicker: false,
      showProgressColorPicker: false,
      showBottomColorPicker: false,
    }
  }

  switchToPicker(activate) {
    const picker = JSON.stringify(activate)
    if (JSON.stringify(this.state).includes(picker.substring(1, picker.length-1))) {
      this.setState({
        ...this.state,
        showTopColorPicker: false,
        showTextColorPicker: false,
        showWaveColorPicker: false,
        showProgressColorPicker: false,
        showBottomColorPicker: false,
      })
    } else {
      this.setState({
        ...this.state,
        showTopColorPicker: false,
        showTextColorPicker: false,
        showWaveColorPicker: false,
        showProgressColorPicker: false,
        showBottomColorPicker: false,
      })
      this.setState(activate)
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
      showTextColorPicker,
      showWaveColorPicker,
      showProgressColorPicker,
      showBottomColorPicker
    } = this.state
    const { theme, showCover, showOverlay } = this.props
    const { backgroundPosition, backgroundSize } = this.props.theme
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
                this.switchToPicker({ showTopColorPicker: true })
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
            <Heading size={500} marginBottom={10}>Text Color</Heading>
            <div
              className='colorPickerToggle'
              style={{
                border: showTextColorPicker ? '1px solid #ccc' : '1px solid transparent',
                backgroundColor: theme.textColor
              }}
              onClick={() => {
                this.switchToPicker({ showTextColorPicker: true })
              }}
            />
            { showTextColorPicker && <SwatchesPicker
              color={theme.textColor}
              onChangeComplete={(color) => {
                this.props.onUpdate({ theme: {...theme, textColor: color.hex} })
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
                this.switchToPicker({ showWaveColorPicker: true })
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
                this.switchToPicker({ showProgressColorPicker: true })
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
                this.switchToPicker({ showBottomColorPicker: true })
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
            <Heading size={400}>
              Background image
              <Popover
                content={
                  <Pane
                    width={280}
                    height={80}
                    padding={20}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexDirection="column"
                  >
                    <Text>Optimal size is 1280x720 px. Image will be scaled to cover the area.</Text>
                  </Pane>
                }
              >
                <Button style={{ float: 'right' }}><Icon icon="info-sign" /></Button>
              </Popover>              
            </Heading>
            <Switch
              height={24}
              checked={showCover}
              onChange={() => {
                this.props.onUpdate({ showCover: !showCover })
              }}
            />
          </Pane>
          { showCover && <Pane marginBottom={30} alignItems="left" justifyContent="left">
            <Heading size={400}>Background options</Heading>
            <Select
              defaultValue={backgroundPosition}
              onChange={event => this.props.onUpdate({ theme: {...theme, backgroundPosition: event.target.value }})}
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </Select>

            <Select
              defaultValue={backgroundSize}
              onChange={event => this.props.onUpdate({ theme: {...theme, backgroundSize: event.target.value }})}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="50%">50%</option>
              <option value="100%">100%</option>
              <option value="200%">200%</option>
              <option value="300%">300%</option>
              <option value="400%">400%</option>
            </Select>
          </Pane> }
          { showCover && <Pane marginBottom={30} alignItems="left" justifyContent="left">
            <Heading size={400}>Overlay</Heading>
            <Switch
              height={24}
              checked={showOverlay}
              onChange={() => {
                this.props.onUpdate({ showOverlay: !showOverlay })
              }}
            />
          </Pane> }
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