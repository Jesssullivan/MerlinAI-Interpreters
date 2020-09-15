
import React from 'react';
import { View } from 'react-native';
import {audio_utils, spectrogram_utils} from "../src";

export const Tmp = () => {
    return (
      // Try setting `alignItems` to 'flex-start'
      // Try setting `justifyContent` to `flex-end`.
      // Try setting `flexDirection` to `row`.
      <View style={{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
      }}>
        <View style={{width: 50, height: 50, backgroundColor: 'powderblue'}} />
        <View style={{height: 50, backgroundColor: 'skyblue'}} />
        <View style={{height: 100, backgroundColor: 'steelblue'}} />
      </View>
    );
};


_resolveRecMsg = (x: void) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(()=> x);
        }, 1000);
    });
};

resolveRecMsg = async () => {
    this.RecMsg = 'finished recording';
    await this._resolveRecMsg();
    this.RecMsg = 'finished recordingxxx YEET';
}
