import React, { Component } from 'react';
import {RecorderToggles} from "./RecorderToggles";

// @ts-ignore
import Audio from 'react-native-audio-polyfill';

import {
  View
} from 'react-native';

export class RecButtons extends Component {

  render() {
    return (
        <View>
          <RecorderToggles></RecorderToggles>
        </View>
    );
  }
}
