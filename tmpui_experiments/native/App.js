import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  ScrollView
} from 'react-native';
import {RecButtons} from './RecBtns';
import {AppHeader} from './AppHeader';


export class App extends Component {
  render() {
    return (
        <View style={styles.container}>
          <AppHeader></AppHeader>
          <ScrollView>
            <View style={[styles.content]}>
              <View style={[styles.box]}>
                <RecButtons/>
              </View>
            </View>
          </ScrollView>
          <View style={[styles.footer]}></View>
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
    height: 40,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: '#03A9F4',
    zIndex: 10
  },
  content: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8
  },
  footer: {
    height: 50,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8BC34A'
  },
  box: {
    width: '100%',
    height: '100%',
    marginBottom: 2
  }
});
