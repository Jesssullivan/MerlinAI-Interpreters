import React, { Component } from 'react';
import {
    StyleSheet, Text,
    View,
} from 'react-native';

export class AppHeader extends Component {
  render() {
      return (
      <View style={styles.container}>
        <View style={[styles.header]}>
            <View>
                <Text style={{ fontSize: 24 }}> tmpUI Native Tests </Text>
            </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  header: {
    height: 100,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#3A7734',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center'
  }
});