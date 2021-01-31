import React, { Component } from 'react';
import AudioRecorderPlayer from "react-native-audio-recorder-player";

import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';

const btnStyles = StyleSheet.create({
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

const audioRecorderPlayer = new AudioRecorderPlayer();

export class RecButtons extends Component {

  RecMsg = 'Tap to begin recording';
  PSMsg = 'Play/Stop';
  complete: void | undefined;

  state = {
    recIsPressed: true,
    playStopIsPressed: true
  };

  onRecPress = async () => {

    this.setState({
      recIsPressed: !this.state.recIsPressed
    });

    if (this.state.recIsPressed) {

      this.RecMsg = 'Recording!';

      audioRecorderPlayer.addRecordBackListener((e: { current_position: number; }) => {
        this.setState({
          recordSecs: e.current_position,
          recordTime: audioRecorderPlayer.mmssss(
              Math.floor(e.current_position),
          ),
        });

        return;

      });

    } else {

      this.RecMsg = 'Tap to begin recording';
      const result = await audioRecorderPlayer.stopRecorder();

      this.setState({
        recordSecs: 0,
      });

      console.log(result);

    }
  }

  onPlayStopPress = async () => {

    this.setState({
      playStopIsPressed: !this.state.playStopIsPressed
    });

    if (this.state.playStopIsPressed) {

      this.PSMsg = 'Playing...';
      console.log('onStartPlay');

      const fileInfo = await audioRecorderPlayer.startPlayer();
      console.log(fileInfo);

      audioRecorderPlayer.addPlayBackListener((e: { current_position: number; duration: number; }) => {

        if (e.current_position === e.duration) {

          console.log('finished');
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();

          this.setState({
            currentPositionSec: e.current_position,
            currentDurationSec: e.duration,
            playTime: audioRecorderPlayer.mmssss(Math.floor(e.current_position)),
            duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
          });
        }

        return;

      });

    } else {

      console.log('onStopPlay');
      audioRecorderPlayer.removePlayBackListener();
      this.PSMsg = 'Play/Stop';
    }
  }

  render() {
    return (
        <View>
          <View style={btnStyles.container}>
            <TouchableOpacity
                style={btnStyles.button}
                onPress={this.onRecPress}>
              <Text>
                {this.RecMsg}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={btnStyles.container}>
            <TouchableOpacity
                style={btnStyles.button}
                onPress={this.onPlayStopPress}>
              <Text>
                {this.PSMsg}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
    );
  }
}
