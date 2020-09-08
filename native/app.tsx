import React, { Component } from 'react';
// @ts-ignore
import Recording from "react-native-recording";

import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';

let Msg: string;

export class App extends Component {

  state = {
    isPressed: true
  };

  onPress = () => {
    const listener = Recording.addRecordingEventListener((data: any) =>
      console.log(data)
    );

    this.setState({
      isPressed: !this.state.isPressed
    });

    if (this.state.isPressed) {
      Recording.init({
        bufferSize: 4096,
        sampleRate: 44100,
        bitsPerChannel: 16,
        channelsPerFrame: 1,
      });

      Recording.start();
      Msg = 'Recording!';

    } else {

      Recording.stop();
      listener.remove();
      alert('Stopped Recording!');
      Msg = 'Tap to begin recording';

    }
  }

 render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity
         style={styles.button}
         onPress={this.onPress}>
         <Text>Record...</Text>
        </TouchableOpacity>
          <View>
            <Text>
              {Msg}
            </Text>
        </View>
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
