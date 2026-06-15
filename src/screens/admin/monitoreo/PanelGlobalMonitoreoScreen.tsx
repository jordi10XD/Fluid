import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

import { Colors, Spacing, Radius, Shadow } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';
import PressableStatCard from './components/PressableStatCard';
import { MonitoreoStackParamList } from './MonitoreoNavigator';

type BusStatus = 'active' | 'delayed' | 'stopped';
interface BusData { id: string; lat: number; lng: number; route: string; status: BusStatus; unidad_numero: string }

const BUS_COLOR: Record<BusStatus, string> = {
  active:  Colors.success,
  delayed: Colors.warning,
  stopped: Colors.danger,
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_SHEET_HEIGHT = 300; 
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.75; 

type NavProp = StackNavigationProp<MonitoreoStackParamList, 'MonitoreoGlobal'>;

export default function PanelGlobalMonitoreoScreen() {
  const navigation = useNavigation<NavProp>();
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  
  const [buses, setBuses] = useState<BusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBuses: 0,
    delays: 0,
    alerts: 0,
    activeRoutes: 0,
    totalRoutes: 0,
  });

  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (translateY.value + event.translationY > -(MAX_SHEET_HEIGHT - MIN_SHEET_HEIGHT)) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY < -50 || event.velocityY < -500) {
        translateY.value = withSpring(-(MAX_SHEET_HEIGHT - MIN_SHEET_HEIGHT), { damping: 25, stiffness: 180, mass: 0.8 });
      } else {
        translateY.value = withSpring(0, { damping: 25, stiffness: 180, mass: 0.8 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch trips
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*');
      if (tripsError) throw tripsError;

      // 2. Fetch telemetry locations
      const { data: locations, error: locError } = await supabase
        .from('trip_locations')
        .select('*');

      // 3. Fetch routes
      const { data: routes, error: routesError } = await supabase
        .from('routes')
        .select('*');

      // 4. Fetch critical alerts (incidencias)
      const { data: incidencias, error: incidenciasError } = await supabase
        .from('incidencias')
        .select('id, estado')
        .eq('estado', 'PENDIENTE');

      const tripsList = trips || [];
      const activeBusesCount = tripsList.filter(t => t.estado === 'En Ruta').length;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const delaysCount = tripsList.filter(t => {
        if (t.estado === 'Retrasado') return true;
        if (t.estado === 'Completado' || t.estado === 'Cancelado') return false;
        if (t.fecha < todayStr) return true;
        if (t.fecha === todayStr && t.hora_salida < currentHhmm) return true;
        return false;
      }).length;

      const alertsCount = incidencias?.length || 0;
      const totalRoutesCount = routes?.length || 0;

      // Active routes count: unique routes with trips that are En Ruta or En Espera
      const activeRouteIds = new Set(
        tripsList
          .filter(t => t.estado === 'En Ruta' || t.estado === 'En Espera')
          .map(t => t.ruta_id)
      );
      const activeRoutesCount = activeRouteIds.size;

      setStats({
        activeBuses: activeBusesCount,
        delays: delaysCount,
        alerts: alertsCount,
        activeRoutes: activeRoutesCount,
        totalRoutes: totalRoutesCount,
      });

      // Merge active buses for map markers
      const activeTrips = tripsList.filter(t => t.estado === 'En Ruta');
      const mergedBuses = activeTrips.map(trip => {
        const loc = locations?.find(l => l.trip_id === trip.id);
        const routeInfo = routes?.find(r => r.id === trip.ruta_id);

        let current_location = loc?.current_location;
        // Fallback to route origin if location is completely missing or null
        if (!current_location && routeInfo?.origen_coords) {
          current_location = {
            type: 'Point',
            coordinates: [routeInfo.origen_coords.longitude, routeInfo.origen_coords.latitude]
          };
        }

        const isDelayed = trip.estado === 'Retrasado' || (() => {
          if (trip.fecha < todayStr) return true;
          if (trip.fecha === todayStr && trip.hora_salida < currentHhmm) return true;
          return false;
        })();

        return {
          id: trip.id,
          lat: current_location?.coordinates[1] || -1.6669,
          lng: current_location?.coordinates[0] || -78.6536,
          route: trip.ruta_codigo || 'Ruta',
          unidad_numero: trip.unidad_numero || 'S/N',
          status: (isDelayed ? 'delayed' : 'active') as BusStatus
        };
      }).filter(b => b.lat !== undefined && b.lng !== undefined);

      setBuses(mergedBuses);
    } catch (e) {
      console.log('Error fetching monitoring data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Subscribe to changes in trips, locations, and incidents for real-time dashboard updates
    const tripsChan = supabase.channel(`dashboard_trips_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        fetchData();
      })
      .subscribe();

    const locsChan = supabase.channel(`dashboard_locations_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_locations' }, () => {
        fetchData();
      })
      .subscribe();

    const incidentsChan = supabase.channel(`dashboard_incidents_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidencias' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(tripsChan);
      supabase.removeChannel(locsChan);
      supabase.removeChannel(incidentsChan);
    };
  }, [fetchData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* ── Mapa a Pantalla Completa ─────────────────────── */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ latitude: -1.6669, longitude: -78.6536, latitudeDelta: 2.2, longitudeDelta: 2.2 }}
      >
        {buses.map((bus) => (
          <Marker
            key={bus.id}
            coordinate={{ latitude: bus.lat, longitude: bus.lng }}
            onPress={() => setSelectedBus(bus.id === selectedBus ? null : bus.id)}
          >
            <View style={styles.markerWrap}>
              {selectedBus === bus.id && (
                <View style={[styles.markerLabel, { borderColor: BUS_COLOR[bus.status] }]}>
                  <Text style={[styles.markerLabelText, { color: BUS_COLOR[bus.status] }]}>
                    UNIDAD {bus.unidad_numero} · {bus.route}
                  </Text>
                </View>
              )}
              <View style={[styles.markerPin, { backgroundColor: BUS_COLOR[bus.status] }]}>
                <Ionicons name="bus" size={14} color={Colors.white} />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* ── Panel Inferior Deslizable (Draggable Bottom Sheet) ─────────────── */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.bottomSheet, animatedSheetStyle]}>
          
          {/* Handle bar (Barra gris) */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.sheetTitle}>Resumen de Operación</Text>

          {/* Grid de 4 tarjetas con efecto degradado */}
          <View style={styles.grid}>
            <View style={styles.row}>
              <PressableStatCard 
                title="BUSES ACTIVOS" 
                value={loading ? '--' : String(stats.activeBuses).padStart(2, '0')} 
                icon="bus" 
                color={Colors.primary}
                onPress={() => navigation.navigate('BusesActivos')} 
              />
              <PressableStatCard 
                title="RETRASOS" 
                value={loading ? '--' : String(stats.delays).padStart(2, '0')} 
                subtext={stats.delays > 0 ? "Requieren atención" : "Sin retrasos"}
                icon="time" 
                color={Colors.warning}
                onPress={() => navigation.navigate('Retrasos')} 
              />
            </View>
            <View style={styles.row}>
              <PressableStatCard 
                title="ALERTAS CRÍTICAS" 
                value={loading ? '--' : String(stats.alerts).padStart(2, '0')} 
                subtext={stats.alerts > 0 ? "Ver detalles →" : "Todo normal"}
                icon="warning" 
                color={Colors.danger}
                onPress={() => navigation.navigate('AlertasCriticas')} 
              />
              <PressableStatCard 
                title="RUTAS ACTIVAS" 
                value={loading ? '--' : String(stats.activeRoutes).padStart(2, '0')} 
                subtext={`De ${stats.totalRoutes} programadas`} 
                icon="map" 
                color={Colors.accent}
                onPress={() => navigation.navigate('RutasActivas')} 
              />
            </View>
          </View>

          {/* Botón de Reportes */}
          <View style={styles.reportesContainer}>
            <TouchableOpacity 
              style={styles.reportesBtn} 
              activeOpacity={0.8}
              onPress={() => (navigation as any).navigate('Reportes')}
            >
              <Text style={styles.reportesBtnText}>Reportes</Text>
              <Ionicons name="document-text" size={20} color={Colors.white} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ─── Estilos Corregidos ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  // Marcadores de Mapa
  markerWrap: { alignItems: 'center' },
  markerLabel: {
    backgroundColor: Colors.white, borderRadius: Radius.sm, borderWidth: 1.5,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4, ...Shadow.sm,
  },
  markerLabelText: { fontSize: 10, fontWeight: '800' },
  markerPin: { width: 34, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', ...Shadow.sm, borderWidth: 2, borderColor: Colors.white },

  // Panel Deslizable (Asegúrate de que este nombre sea 'bottomSheet')
  bottomSheet: {
    position: 'absolute',
    left: 0, 
    right: 0,
    // Calculamos el bottom dinámicamente según la altura de la pantalla
    bottom: -(MAX_SHEET_HEIGHT - MIN_SHEET_HEIGHT), 
    height: MAX_SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.lg,
    ...Shadow.lg,
  },
  handleContainer: { alignItems: 'center', paddingVertical: 15, paddingBottom: 20 },
  handle: { width: 45, height: 5, backgroundColor: Colors.border, borderRadius: 3 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 15, paddingHorizontal: 5 },
  
  // Grid de Tarjetas
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },

  // Botón Reportes
  reportesContainer: { marginTop: 20 },
  reportesBtn: {
    backgroundColor: '#0f172a', 
    borderRadius: Radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportesBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});