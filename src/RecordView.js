// @flow
import React from 'react';
import Container from '@material-ui/core/Container';
import {IconButton} from "@material-ui/core";
import AudioRecorder from 'audio-recorder-polyfill'
window.MediaRecorder = AudioRecorder


export default class RecordView extends React.Component {
    recorder = new MediaRecorder(this.stream)
    hintTrueString = "Recording..."
    hintFalseString = "Not recording, tap to record!"
    isToggleOn = false

    constructor(props) {
        super(props);
        this.state = {isToggleOn: false};
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.setState(state => ({
            isToggleOn: !state.isToggleOn
        }));
        if (this.isToggleOn) {
            navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {

                // Set record to <audio> when recording will be finished
                this.recorder.addEventListener('dataavailable', e => {
                    this.audio.src = URL.createObjectURL(e.data)
                })
                // Start recording
                this.recorderrecorder.start()
                console.log(this.audio.src)

            });
        } else {
            this.recorder.stop()
            // Remove “recording” icon from browser tab
            // this.recorder.stream.getTracks().forEach(i => i.stop())
            }
        }

    render() {
        return (
            <Container>
                <script src={'spec_record_crop_bundle.js'}/>
                <IconButton onClick={this.handleClick}>
                    {this.state.isToggleOn ? this.hintTrueString : this.hintFalseString}
                </IconButton>
            </Container>
        );
    }
}
