import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import { supabase } from './src/lib/supabase';
import { RoleProvider, useRole } from './src/context/RoleContext';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import { PasajeroTabs, ConductorStackNav, AdminTabs } from './src/navigation/AppTabs';

const Stack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();

function RootNavigator() {
  const { role, setRole, setUserName, setSupabaseUserId } = useRole();
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (userData) {
            setSupabaseUserId(session.user.id);
            let finalRole = 'pasajero';
            let name = userData.nombres || session.user.email?.split('@')[0];

            if (userData.role === 'admin') finalRole = 'admin';
            else if (userData.role === 'operator') finalRole = 'conductor';

            if (finalRole === 'conductor') {
              const { data: driverData } = await supabase.from('driver_profiles').select('nombre').eq('id', session.user.id).maybeSingle();
              if (driverData && driverData.nombre) name = driverData.nombre;
            }

            setRole(finalRole as any);
            setUserName(name || '');
            if (navigationRef.isReady()) {
              navigationRef.navigate('App' as never);
            } else {
              setTimeout(() => {
                if (navigationRef.isReady()) navigationRef.navigate('App' as never);
              }, 500);
            }
          }
        } catch (e) {
          console.log('Error restoring session', e);
        }
      }
      setIsReady(true);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (navigationRef.isReady()) {
          navigationRef.navigate('Login' as never);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const AppTabComponent =
    role === 'conductor' ? ConductorStackNav :
    role === 'admin' ? AdminTabs :
    PasajeroTabs;

  if (!isReady) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        {/* App (role-based tabs) */}
        <Stack.Screen name="App" component={AppTabComponent} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (!url) return;
      
      const hashStr = url.split('#')[1];
      if (hashStr) {
        const params = hashStr.split('&').reduce((acc, item) => {
          const [key, value] = item.split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token
          });

          if (params.type === 'recovery') {
            setTimeout(() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('ResetPassword' as never);
              }
            }, 500);
          }
        }
      }
    };
    
    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => { if (url) handleDeepLink({ url }); });
    
    return () => sub.remove();
  }, []);

  return (
    <RoleProvider>
      <RootNavigator />
    </RoleProvider>
  );
}
