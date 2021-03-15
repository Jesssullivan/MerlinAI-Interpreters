import React, {Component} from 'react';
import {View, Switch, StyleSheet, Text} from 'react-native';
import AudioRecorderPlayer from "react-native-audio-recorder-player";

export class RecorderToggles extends Component {

    audioRecorderPlayer = new AudioRecorderPlayer();

    isRec = false;
    isPlayback = false;

    constructor(props: boolean) {
        super(props);
        this.state = {
            recToggle: false,
            playbackToggle: false

        };
    }

    startRecord = async () => {
        const result = await this.audioRecorderPlayer.startRecorder();
        this.audioRecorderPlayer.addRecordBackListener((e: { current_position: number; }) => {
            this.setState({
                recordSecs: e.current_position,
                recordTime: this.audioRecorderPlayer.mmssss(
                    Math.floor(e.current_position),
                ),
            });
            return;
        });
        console.log(result);
    };

    stopRecord = async () => {
        await this.audioRecorderPlayer.stopRecorder();
        this.audioRecorderPlayer.removeRecordBackListener();
        this.setState({
            recordSecs: 0,
        });
        console.log('- completed recording -');
    };

    startPlay = async () => {
        console.log('Started playback...');
        const msg = await this.audioRecorderPlayer.startPlayer();
        console.log(msg);
        this.audioRecorderPlayer.addPlayBackListener((e: { current_position: number; duration: number; }) => {
            if (e.current_position === e.duration) {
                console.log('Finished playback.');
                this.audioRecorderPlayer.stopPlayer();
                this.setState({playbackToggle: false});
                this.playbackToggleState();
            }
            this.setState({
                currentPositionSec: e.current_position,
                currentDurationSec: e.duration,
                playTime: this.audioRecorderPlayer.mmssss(Math.floor(e.current_position)),
                duration: this.audioRecorderPlayer.mmssss(Math.floor(e.duration)),
            });
            return;
        });
    };

    stopPlay = async () => {
        await this.audioRecorderPlayer.stopPlayer();
        this.audioRecorderPlayer.removePlayBackListener();
        console.log('Stopped playback.');
    };

    recToggleState = async () => {
        this.isRec = !this.isRec;
        if (this.isRec) {
            console.log('Recording...');
            await this.startRecord();
        } else {
            console.log('Recording stopped.');
            await this.stopRecord();
        }
    }

    playbackToggleState = async () => {
        this.isPlayback = !this.isPlayback;
        if (this.isPlayback) {
            console.log('Playing audio...');
            await this.startPlay();
        } else {
            console.log('Playback stopped.');
            await this.stopPlay();
        }
    } // todo: initialize rtc bridge asap --> Saturday...

    render() {
        return (

            <View style={styles.container}>
                <Text> Record On / Off </Text>
                <Switch
                    trackColor={{false: 'blue', true: 'red'}}
                    thumbColor="white"
                    ios_backgroundColor="blue"
                    onValueChange={(value) => {
                        this.setState({recToggle: value});
                        this.recToggleState();
                        }
                    }
                    // @ts-ignore
                    value={this.state.recToggle}
                />
                <Text> Play / Stop </Text>
                <Switch
                    trackColor={{false: 'grey', true: 'purple'}}
                    thumbColor="white"
                    ios_backgroundColor="#3A7734"
                    onValueChange={(value) => {
                        this.setState({playbackToggle: value});
                        this.playbackToggleState();
                    }
                    }
                    // @ts-ignore
                    value={this.state.playbackToggle}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10,
        marginBottom: 10
    }
});
