// this file is the entrypoint for native tests.

import {AppRegistry} from 'react-native';
import {App} from './native/App';

AppRegistry.registerComponent('tmpui', () => App);
