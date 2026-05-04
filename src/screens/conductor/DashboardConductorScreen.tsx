import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, PanResponder, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

// Configuración de dimensiones para el panel deslizable
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_UP = 600; 
const MIN_DOWN = 280; 
const SNAP_TOP = SCREEN_HEIGHT - MAX_UP;
const SNAP_BOTTOM = SCREEN_HEIGHT - MIN_DOWN;

const DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY || '';
const ORIGIN = { latitude: -2.1658274, longitude: -79.6091504 };
const DESTINATION = { latitude: -1.6627475, longitude: -78.6633838 };
const WAYPOINTS = [{ latitude: -2.167868, longitude: -79.46075 }];

export default function DashboardConductorScreen({ navigation }: any) {
  const [timer, setTimer] = useState(8144);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeStats, setRouteStats] = useState({ distance: 424, duration: 465 });

  // Lógica de Animación y Gestos para el Bottom Sheet
  const translateY = useRef(new Animated.Value(SNAP_BOTTOM)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const nextVal = SNAP_BOTTOM + gestureState.dy;
        if (nextVal >= SNAP_TOP && nextVal <= SNAP_BOTTOM + 50) {
          translateY.setValue(nextVal);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50 || (translateY as any)._value < SNAP_TOP + 100) {
          Animated.spring(translateY, { 
            toValue: SNAP_TOP, 
            useNativeDriver: false, 
            bounciness: 4 
          }).start();
        } else {
          Animated.spring(translateY, { toValue: SNAP_BOTTOM, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)} min`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h} h ${m} min`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header flotante */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBrand}>LOGÍSTICA FLUIDA</Text>
          <Text style={styles.unitId}>UNIDAD RF-G04</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="radio-outline" size={20} color={Colors.primary} />
          <View style={styles.activeDot} />
        </View>
      </View>

      {/* Mapa de fondo */}
      <View style={styles.mapWrapper}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          showsUserLocation
          initialRegion={{
            latitude: -2.1658,
            longitude: -79.6091,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <MapViewDirections
            origin={location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : ORIGIN}
            destination={DESTINATION}
            waypoints={WAYPOINTS}
            apikey={DIRECTIONS_API_KEY}
            strokeWidth={5}
            strokeColor={Colors.accent}
            onReady={(result) => {
              setRouteStats({ distance: result.distance, duration: result.duration });
            }}
          />
        </MapView>
      </View>

      {/* Panel Deslizable (Bottom Sheet) */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={styles.handleBar} />
          <Text style={styles.handleText}>PANEL DE CONTROL OPERATIVO</Text>
        </View>

        <View style={styles.sheetContent}>
          {/* Tarjeta de Ruta */}
          <View style={styles.routeCard}>
            <View style={styles.routeAccent} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>RUTA ACTUAL</Text>
              <Text style={styles.routeTitle}>Quito — Guayaquil</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={16} color="#0284C7" />
                  <Text style={styles.statValSmall}>ETA: {formatDuration(routeStats.duration).toUpperCase()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="location-outline" size={16} color={Colors.success} />
                  <Text style={styles.statValSmall}>DIST: {routeStats.distance.toFixed(1)} KM</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cuadrícula de Telemetría */}
          <View style={styles.telGrid}>
            <View style={styles.telCell}>
              <Text style={styles.telLabel}>SATÉLITE</Text>
              <Text style={styles.telVal}>98%</Text>
            </View>
            <View style={styles.telCell}>
              <Text style={styles.telLabel}>CONDUCCIÓN</Text>
              <Text style={styles.telVal}>{formatTimer(timer)}</Text>
            </View>
            <View style={styles.telCell}>
              <Text style={styles.telLabel}>VELOCIDAD</Text>
              <Text style={styles.telVal}>72 <Text style={styles.telSub}>km/h</Text></Text>
            </View>
            <View style={styles.telCell}>
              <Text style={styles.telLabel}>ESTADO GPS</Text>
              <Text style={[styles.telVal, {color: Colors.success, fontSize: 16}]}>ACTIVO</Text>
            </View>
          </View>

          {/* Botones de acción */}
          <TouchableOpacity 
            style={styles.startBtn} 
            onPress={() => navigation.navigate('MapaNavegacion')}
          >
            <Ionicons name="play" size={22} color={Colors.white} />
            <View>
              <Text style={styles.actionBtnMain}>CONTINUAR NAVEGACIÓN</Text>
              <Text style={styles.actionBtnSub}>MAPA EN TIEMPO REAL</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endBtn}>
            <Ionicons name="stop" size={22} color={Colors.textSecondary} />
            <Text style={styles.endBtnMain}>FINALIZAR RUTA</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.lg,
    paddingTop: 52, paddingBottom: Spacing.sm,
    ...Shadow.sm,
  },
  headerBrand: { fontSize: 16, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  unitId: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  
  mapWrapper: { flex: 1, zIndex: 1 },
  
  bottomSheet: {
    position: 'absolute', left: 0, right: 0, height: MAX_UP,
    backgroundColor: Colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    zIndex: 20, ...Shadow.lg, elevation: 25,
  },
  handleContainer: {
    alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  handleBar: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, marginBottom: 8 },
  handleText: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1.5 },
  
  sheetContent: { padding: Spacing.lg },
  
  routeCard: {
    borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', marginBottom: Spacing.md,
  },
  routeAccent: { width: 5, backgroundColor: Colors.accent },
  routeContent: { flex: 1, padding: Spacing.md },
  routeLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', marginBottom: 4 },
  routeTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 15 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValSmall: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  telGrid: { 
    flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md, 
    borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border 
  },
  telCell: { width: '50%', padding: 12, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.border },
  telLabel: { fontSize: 8, color: Colors.textMuted, fontWeight: '700', marginBottom: 2 },
  telVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  telSub: { fontSize: 10, color: Colors.textSecondary },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.md,
  },
  actionBtnMain: { color: Colors.white, fontSize: 16, fontWeight: '800' },
  actionBtnSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.borderLight, borderRadius: Radius.lg, padding: Spacing.md,
  },
  endBtnMain: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700' },
});
