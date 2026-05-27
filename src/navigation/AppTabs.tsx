import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

// Pasajero screens
import MapaSeguimientoScreen from '../screens/pasajero/MapaSeguimientoScreen';
import RouteSearchScreen from '../screens/pasajero/RouteSearchScreen';
import CentroNotificacionesScreen from '../screens/pasajero/CentroNotificacionesScreen';
import PerfilUsuarioScreen from '../screens/pasajero/PerfilUsuarioScreen';

// Conductor screens
import DashboardConductorScreen from '../screens/conductor/DashboardConductorScreen';
import MapaNavegacionScreen from '../screens/conductor/MapaNavegacionScreen';
import ReporteIncidenciasScreen from '../screens/conductor/ReporteIncidenciasScreen';

// Admin screens
import MonitoreoNavigator from '../screens/admin/monitoreo/MonitoreoNavigator';
import ControlScreen from '../screens/admin/control';
import EmisorNotificacionesScreen from '../screens/admin/EmisorNotificacionesScreen';
import ViajesScreen from '../screens/admin/ViajesScreen';

import { useRole } from '../context/RoleContext';

const Tab = createBottomTabNavigator();
const ConductorStack = createStackNavigator();

export function ConductorStackNav() {
  return (
    <ConductorStack.Navigator screenOptions={{ headerShown: false }}>
      <ConductorStack.Screen name="DashboardConductor" component={DashboardConductorScreen} />
      <ConductorStack.Screen name="MapaNavegacion" component={MapaNavegacionScreen} />
      <ConductorStack.Screen name="Perfil" component={PerfilUsuarioScreen} />
    </ConductorStack.Navigator>
  );
}

const TAB_BAR_STYLE = {
  backgroundColor: Colors.white,
  borderTopColor: Colors.border,
  borderTopWidth: 1,
  height: 70,
  paddingBottom: 10,
  paddingTop: 8,
};

const TAB_LABEL_STYLE = { fontSize: 10, fontWeight: '600' as const };

export function PasajeroTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: TAB_LABEL_STYLE,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, any> = {
            Mapa: focused ? 'map' : 'map-outline',
            Buscar: focused ? 'search' : 'search-outline',
            Alertas: focused ? 'notifications' : 'notifications-outline',
            Perfil: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Mapa" component={MapaSeguimientoScreen} />
      <Tab.Screen name="Buscar" component={RouteSearchScreen} />
      <Tab.Screen name="Alertas" component={CentroNotificacionesScreen} />
      <Tab.Screen name="Perfil">
        {() => <PerfilUsuarioScreen navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ConductorTabs removed as per new design

export function AdminTabs({ navigation }: any) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: TAB_LABEL_STYLE,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, any> = {
            Monitor: focused ? 'analytics' : 'analytics-outline',
            Control: focused ? 'options' : 'options-outline',
            Notif:   focused ? 'megaphone' : 'megaphone-outline',
            Viajes:  focused ? 'bus' : 'bus-outline',
            Perfil:  focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Monitor" component={MonitoreoNavigator} />
      <Tab.Screen name="Control" component={ControlScreen} />
      <Tab.Screen name="Viajes" component={ViajesScreen} />
      <Tab.Screen name="Notif" component={EmisorNotificacionesScreen} />
      <Tab.Screen name="Perfil">
        {() => <PerfilUsuarioScreen navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
