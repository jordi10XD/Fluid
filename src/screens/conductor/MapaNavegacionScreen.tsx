import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, 
  Animated, PanResponder, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

// Constantes de dimensiones para el Panel Deslizable
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_UP = 380; 
const MIN_DOWN = 100; 
const SNAP_TOP = SCREEN_HEIGHT - MAX_UP;
const SNAP_BOTTOM = SCREEN_HEIGHT - MIN_DOWN;

const DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY || '';
const ORIGIN = { latitude: -2.1658274, longitude: -79.6091504 };
const DESTINATION = { latitude: -1.6627475, longitude: -78.6633838 };
const WAYPOINTS = [{ latitude: -2.167868, longitude: -79.46075 }];

// Sub-componente del Mapa
const OperativeMap = ({ 
  location, 
  onRouteReady 
}: { 
  location: Location.LocationObject | null,
  onRouteReady: (result: any) => void 
}) => {
  const currentOrigin = location 
    ? { latitude: location.coords.latitude, longitude: location.coords.longitude } 
    : ORIGIN;

  return (
    <View style={styles.mapWrapper}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation
        followsUserLocation
        showsTraffic={true}
        initialRegion={{
          latitude: -1.9,
          longitude: -79.1,
          latitudeDelta: 1.5,
          longitudeDelta: 1.5,
        }}
      >
        <MapViewDirections
          origin={currentOrigin}
          destination={DESTINATION}
          waypoints={WAYPOINTS}
          apikey={DIRECTIONS_API_KEY}
          strokeWidth={6}
          strokeColor={Colors.accent}
          optimizeWaypoints={true}
          mode="DRIVING"
          onReady={onRouteReady}
        />
        <Marker coordinate={ORIGIN} title="Terminal Milagro">
          <View style={styles.startPoint}><Text style={styles.startPointText}>M</Text></View>
        </Marker>
        <Marker coordinate={WAYPOINTS[0]} title="Parada Naranjito">
          <View style={[styles.startPoint, { backgroundColor: Colors.warning }]}><Text style={styles.startPointText}>N</Text></View>
        </Marker>
        <Marker coordinate={DESTINATION} title="Terminal Riobamba">
          <View style={[styles.startPoint, { backgroundColor: Colors.primary }]}><Text style={styles.startPointText}>R</Text></View>
        </Marker>
      </MapView>
    </View>
  );
};

export default function MapaNavegacionScreen({ navigation }: any) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });

  // Referencia para el valor de la animación (posición Y del panel)
  const translateY = useRef(new Animated.Value(SNAP_BOTTOM)).current;

  // Configuración del PanResponder para detectar arrastre
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const nextVal = SNAP_BOTTOM + gestureState.dy;
        if (nextVal >= SNAP_TOP && nextVal <= SNAP_BOTTOM) {
          translateY.setValue(nextVal);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const isMovingUp = gestureState.dy < -50 || (translateY as any)._value < SNAP_TOP + 100;
        if (isMovingUp) {
          Animated.spring(translateY, { toValue: SNAP_TOP, useNativeDriver: false }).start();
        } else {
          Animated.spring(translateY, { toValue: SNAP_BOTTOM, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => setLocation(loc)
      );
      
      return () => subscription.remove();
    })();
  }, []);

  const calculateETA = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + routeInfo.duration);
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>MAPA OPERATIVO</Text>
          <Text style={styles.headerSub}>Milagro → Naranjito → Riobamba</Text>
        </View>
        <View style={styles.gpsOnBadge}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsOnText}>GPS ON</Text>
        </View>
      </View>

      <OperativeMap 
        location={location} 
        onRouteReady={(res) => setRouteInfo({ distance: res.distance, duration: res.duration })} 
      />

      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers} style={styles.handleContainer}>
          <View style={styles.handleBar} />
          <Text style={styles.handleText}>INFO DE TRAYECTO</Text>
        </View>

        <View style={styles.sheetContent}>
          <View style={styles.infoGrid}>
            <InfoCell label="PRÓXIMA PARADA" val="Terminal Riobamba" icon="flag-outline" />
            <InfoCell label="DISTANCIA" val={`${routeInfo.distance.toFixed(1)} km`} icon="navigate-outline" />
            <InfoCell label="VELOCIDAD" val="72 km/h" icon="speedometer-outline" />
            <InfoCell label="ETA DESTINO" val={calculateETA()} icon="time-outline" />
          </View>

          <TouchableOpacity style={styles.incidentBtn} onPress={() => navigation.navigate('ReporteIncidencias')}>
            <Ionicons name="warning-outline" size={18} color={Colors.danger} />
            <Text style={styles.incidentBtnText}>Reportar Incidencia</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const InfoCell = ({ label, val, icon }: any) => (
  <View style={styles.infoCell}>
    <Ionicons name={icon} size={16} color={Colors.accent} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoVal}>{val}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    zIndex: 10,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, paddingTop: 52, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  headerSub: { fontSize: 12, color: Colors.textMuted },
  gpsOnBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  gpsDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  gpsOnText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  
  mapWrapper: { ...StyleSheet.absoluteFillObject, zIndex: 1 },

  bottomSheet: {
    position: 'absolute', left: 0, right: 0, height: SCREEN_HEIGHT,
    backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    zIndex: 20, ...Shadow.lg,
  },
  handleContainer: { alignItems: 'center', paddingVertical: 12 },
  handleBar: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#ccc', marginBottom: 8 },
  handleText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1 },
  sheetContent: { padding: Spacing.lg },
  
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md },
  infoCell: { width: '50%', paddingVertical: 12 },
  infoLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', marginVertical: 3 },
  infoVal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  incidentBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: Radius.md, padding: 16, backgroundColor: '#FEF2F2',
  },
  incidentBtnText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  startPoint: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  startPointText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
});
