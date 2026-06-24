import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { TouchableOpacity } from 'react-native';

// Pasajero screens
import MapaSeguimientoScreen from '../screens/pasajero/MapaSeguimientoScreen';
import RouteSearchScreen from '../screens/pasajero/RouteSearchScreen';
import ResultadosHorariosScreen from '../screens/pasajero/ResultadosHorariosScreen';
import CentroNotificacionesScreen from '../screens/pasajero/CentroNotificacionesScreen';
import PerfilUsuarioScreen from '../screens/pasajero/PerfilUsuarioScreen';

// Conductor screens
import DashboardConductorScreen from '../screens/conductor/DashboardConductorScreen';
import MapaNavegacionScreen from '../screens/conductor/MapaNavegacionScreen';
import HistorialNotificacionesConductorScreen from '../screens/conductor/HistorialNotificacionesConductorScreen';

// Admin screens
import PanelGlobalMonitoreoScreen from '../screens/admin/monitoreo/PanelGlobalMonitoreoScreen';
import ControlScreen from '../screens/admin/control';
import EmisorNotificacionesScreen from '../screens/admin/EmisorNotificacionesScreen';
import ViajesScreen from '../screens/admin/ViajesScreen';
import HistorialNotificacionesScreen from '../screens/admin/HistorialNotificacionesScreen';
import PerfilAdminScreen from '../screens/admin/PerfilAdminScreen';
import ReportesScreen from '../screens/admin/ReportesScreen';

// Admin monitoreo sub-screens
import BusesActivosScreen from '../screens/admin/monitoreo/BusesActivosScreen';
import AlertasCriticasScreen from '../screens/admin/monitoreo/AlertasCriticasScreen';
import RutasActivasScreen from '../screens/admin/monitoreo/RutasActivasScreen';
import RetrasosScreen from '../screens/admin/monitoreo/RetrasosScreen';

const Tab = createBottomTabNavigator();
const ConductorStack = createStackNavigator();
const AdminStack = createStackNavigator();
const BuscarStack = createStackNavigator();

export function BuscarStackNav() {
  return (
    <BuscarStack.Navigator screenOptions={{ headerShown: false }}>
      <BuscarStack.Screen name="RouteSearch" component={RouteSearchScreen} />
      <BuscarStack.Screen name="ResultadosHorarios" component={ResultadosHorariosScreen} />
    </BuscarStack.Navigator>
  );
}

export function ConductorStackNav() {
  return (
    <ConductorStack.Navigator screenOptions={{ headerShown: false }}>
      <ConductorStack.Screen name="DashboardConductor" component={DashboardConductorScreen} />
      <ConductorStack.Screen name="MapaNavegacion" component={MapaNavegacionScreen} />
      <ConductorStack.Screen name="Perfil" component={PerfilUsuarioScreen} />
      <ConductorStack.Screen name="HistorialNotificacionesConductor" component={HistorialNotificacionesConductorScreen} />
    </ConductorStack.Navigator>
  );
}

const TAB_BAR_STYLE = {
  height: 70,
  paddingBottom: 10,
  paddingTop: 6,
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#e2e8f0',
};

const TAB_LABEL_STYLE = { fontSize: 11, fontWeight: '600' as const };

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
      <Tab.Screen name="Buscar" component={BuscarStackNav} />
      <Tab.Screen name="Alertas" component={CentroNotificacionesScreen} />
      <Tab.Screen name="Perfil">
        {() => <PerfilUsuarioScreen navigation={navigation} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Monitor"
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerTitle: getHeaderTitle(route.name),
        headerStyle: {
          backgroundColor: '#0F172A',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
        },
        headerRight: () => (
          <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => navigation.getParent()?.navigate('PerfilAdmin')}
          >
            <Ionicons name="person-circle" size={30} color="#fff" />
          </TouchableOpacity>
        ),
        tabBarStyle: TAB_BAR_STYLE,
        tabBarLabelStyle: TAB_LABEL_STYLE,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, any> = {
            Monitor: focused ? 'analytics' : 'analytics-outline',
            Control: focused ? 'options' : 'options-outline',
            Viajes: focused ? 'bus' : 'bus-outline',
            Notif: focused ? 'megaphone' : 'megaphone-outline',
          };
          return <Ionicons name={icons[route.name]} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Monitor" component={PanelGlobalMonitoreoScreen} />
      <Tab.Screen name="Control" component={ControlScreen} />
      <Tab.Screen name="Viajes" component={ViajesScreen} />
      <Tab.Screen name="Notif" component={EmisorNotificacionesScreen} />
    </Tab.Navigator>
  );
}

export function AdminStackNav() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs principales */}
      <AdminStack.Screen name="AdminTabs" component={AdminTabs} />

      {/* Screens a las que se navega desde los tabs */}
      <AdminStack.Screen name="PerfilAdmin" component={PerfilAdminScreen} />
      <AdminStack.Screen name="HistorialNotificaciones" component={HistorialNotificacionesScreen} />
      <AdminStack.Screen name="BusesActivos" component={BusesActivosScreen} />
      <AdminStack.Screen name="AlertasCriticas" component={AlertasCriticasScreen} />
      <AdminStack.Screen name="RutasActivas" component={RutasActivasScreen} />
      <AdminStack.Screen name="Retrasos" component={RetrasosScreen} />
      <AdminStack.Screen name="Reportes" component={ReportesScreen} />
    </AdminStack.Navigator>
  );
}

const getHeaderTitle = (routeName: string): string => {
  switch (routeName) {
    case 'Monitor': return 'Monitoreo Global';
    case 'Control': return 'Inventario y Logística';
    case 'Viajes': return 'Viajes';
    case 'Notif': return 'Notificaciones';
    default: return 'Monitoreo Global';
  }
};
