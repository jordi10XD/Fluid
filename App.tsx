import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RoleProvider, useRole } from './src/context/RoleContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import { PasajeroTabs, ConductorTabs, AdminTabs } from './src/navigation/AppTabs';

const Stack = createStackNavigator();

function RootNavigator() {
  const { role } = useRole();

  const AppTabComponent =
    role === 'conductor' ? ConductorTabs :
    role === 'admin' ? AdminTabs :
    PasajeroTabs;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        {/* App (role-based tabs) */}
        <Stack.Screen name="App" component={AppTabComponent} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <RootNavigator />
    </RoleProvider>
  );
}
