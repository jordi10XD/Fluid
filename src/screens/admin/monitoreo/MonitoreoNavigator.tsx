import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Pantallas
import PanelGlobalMonitoreoScreen from './PanelGlobalMonitoreoScreen';
import BusesActivosScreen from './BusesActivosScreen';
import RetrasosScreen from './RetrasosScreen';
import AlertasCriticasScreen from './AlertasCriticasScreen';
import RutasActivasScreen from './RutasActivasScreen';

export type MonitoreoStackParamList = {
  MonitoreoGlobal: undefined;
  BusesActivos: undefined;
  Retrasos: undefined;
  AlertasCriticas: undefined;
  RutasActivas: undefined;
};

const Stack = createStackNavigator<MonitoreoStackParamList>();

export default function MonitoreoNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Pantalla principal con el mapa y el panel deslizable */}
      <Stack.Screen name="MonitoreoGlobal" component={PanelGlobalMonitoreoScreen} />
      
      {/* Pantallas de Detalle */}
      <Stack.Screen name="BusesActivos" component={BusesActivosScreen} />
      <Stack.Screen name="Retrasos" component={RetrasosScreen} />
      <Stack.Screen name="AlertasCriticas" component={AlertasCriticasScreen} />
      <Stack.Screen name="RutasActivas" component={RutasActivasScreen} />
    </Stack.Navigator>
  );
}