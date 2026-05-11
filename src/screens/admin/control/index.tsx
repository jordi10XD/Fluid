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

// ── Los 4 tabs ────────────────────────────────────────────────────────────────
import UnidadesTab    from './tabs/UnidadesTab';
import RutasTab       from './tabs/RutasTab';         // crear siguiendo UnidadesTab
import ConductoresTab from './tabs/ConductoresTab';   // ídem
import HorariosTab    from './tabs/HorariosTab';      // ídem

// ─── Tipos de navegación ──────────────────────────────────────────────────────
export type ControlTabParamList = {
  Unidades:    undefined;
  Rutas:       undefined;
  Conductores: undefined;
  Horarios:    undefined;
};

const Tab = createMaterialTopTabNavigator<ControlTabParamList>();

// ─── Header ───────────────────────────────────────────────────────────────────
// Componente separado para poder reutilizarlo si en el futuro
// alguna pantalla de detalle necesita el mismo encabezado.
function ControlHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.headerSup}>PANEL DE CONTROL LOGÍSTICO</Text>
      <Text style={styles.headerTitle}>Inventario y Logística</Text>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function ControlScreen() {
  return (
    <View style={styles.container}>
      <ControlHeader />

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

  // Header oscuro
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerSup: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
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
