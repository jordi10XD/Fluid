/**
 * src/screens/admin/control/index.tsx
 *
 * Host del módulo Control.
 * Responsabilidad única: montar el header + los 4 Top Tabs.
 * No tiene lógica de datos ni de UI propia más allá de eso.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '../../../theme/colors';

// Los 5 tabs
import UnidadesTab    from './tabs/UnidadesTab';
import RutasTab       from './tabs/RutasTab';
import ConductoresTab from './tabs/ConductoresTab';
import HorariosTab    from './tabs/HorariosTab';
import UsuariosTab    from './tabs/UsuariosTab';

// ─── Tipos de navegación ──────────────────────────────────────────────────────
export type ControlTabParamList = {
  Unidades:    undefined;
  Rutas:       undefined;
  Conductores: undefined;
  Horarios:    undefined;
  Usuarios:    undefined;
};

const Tab = createMaterialTopTabNavigator<ControlTabParamList>();

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function ControlScreen() {
  return (
    <View style={styles.container}>

      <Tab.Navigator
        screenOptions={{
          // ── Barra de tabs ──
          tabBarStyle:           styles.tabBar,
          tabBarLabelStyle:      styles.tabLabel,
          tabBarIndicatorStyle:  styles.tabIndicator,
          tabBarActiveTintColor:   Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarPressColor:        Colors.primary + '15',

          // ── Rendimiento ──
          // lazy: solo monta un tab cuando el usuario lo visita por primera vez.
          // Evita hacer 4 peticiones a Supabase al abrir la pantalla.
          lazy: true,
          lazyPreloadDistance: 0,
        }}
      >
        <Tab.Screen name="Unidades"    component={UnidadesTab} />
        <Tab.Screen name="Rutas"       component={RutasTab} />
        <Tab.Screen name="Conductores" component={ConductoresTab} />
        <Tab.Screen name="Horarios"    component={HorariosTab} />
        <Tab.Screen name="Usuarios"    component={UsuariosTab} />
      </Tab.Navigator>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Barra de pestañas
  tabBar: {
    backgroundColor: '#FFFFFF',
    elevation: 0,          // Android: quita sombra de la tab bar
    shadowOpacity: 0,      // iOS: ídem
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'none', // evita que React Navigation ponga TODO EN MAYÚSCULAS
    letterSpacing: 0,
  },
  tabIndicator: {
    backgroundColor: Colors.primary,
    height: 2,
  },
});
