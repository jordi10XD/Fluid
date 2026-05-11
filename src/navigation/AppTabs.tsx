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
import PanelGlobalMonitoreoScreen from '../screens/admin/PanelGlobalMonitoreoScreen';
import ControlScreen from '../screens/admin/control';
import EmisorNotificacionesScreen from '../screens/admin/EmisorNotificacionesScreen';

import { useRole } from '../context/RoleContext';

const Tab = createBottomTabNavigator();
const ConductorStack = createStackNavigator();

function ConductorStackNav() {
  return (
    <ConductorStack.Navigator screenOptions={{ headerShown: false }}>
      <ConductorStack.Screen name="DashboardConductor" component={DashboardConductorScreen} />
      <ConductorStack.Screen name="MapaNavegacion" component={MapaNavegacionScreen} />
      <ConductorStack.Screen name="ReporteIncidencias" component={ReporteIncidenciasScreen} />
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

export function ConductorTabs({ navigation }: any) {
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
            Ruta: focused ? 'navigate' : 'navigate-outline',
            Mapa: focused ? 'map' : 'map-outline',
            Reportes: focused ? 'document-text' : 'document-text-outline',
            Perfil: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Ruta" component={ConductorStackNav} />
      <Tab.Screen name="Mapa" component={MapaNavegacionScreen} />
      <Tab.Screen name="Reportes" component={ReporteIncidenciasScreen} />
      <Tab.Screen name="Perfil">
        {() => <PerfilUsuarioScreen navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

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
            Perfil:  focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Monitor" component={PanelGlobalMonitoreoScreen} />
      <Tab.Screen name="Control" component={ControlScreen} />
      <Tab.Screen name="Notif" component={EmisorNotificacionesScreen} />
      <Tab.Screen name="Perfil">
        {() => <PerfilUsuarioScreen navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
