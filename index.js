import { registerRootComponent } from 'expo';
import { Text } from 'react-native';

import App from './App';

// Đặt cấu hình mặc định cho Text toàn bộ app
Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
