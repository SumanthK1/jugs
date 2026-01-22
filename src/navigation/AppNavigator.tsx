import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { DrawRouteScreen } from '../screens/DrawRouteScreen';
import { LoadingScreen } from '../screens/LoadingScreen';
import { RouteSentScreen } from '../screens/RouteSentScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="DrawRoute" component={DrawRouteScreen} />
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name="RouteSent" component={RouteSentScreen} />
    </Stack.Navigator>
  );
}
