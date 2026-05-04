import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

const DIRECTIONS_API_KEY = process.env.EXPO_PUBLIC_DIRECTIONS_API_KEY || '';
const ORIGIN = { latitude: -2.1658274, longitude: -79.6091504 }; // Terminal Milagro
const DESTINATION = { latitude: -1.6627475, longitude: -78.6633838 }; // Terminal Riobamba
const WAYPOINTS = [{ latitude: -2.167868, longitude: -79.46075 }]; // Parada Naranjito

// Operative Map with Directions
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
    <View style={styles.mapContainer}>
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
          onError={(errorMessage) => {
            console.log('Error en la ruta:', errorMessage);
          }}
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

      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn}><Ionicons name="add" size={20} color={Colors.textPrimary} /></TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn}><Ionicons name="remove" size={20} color={Colors.textPrimary} /></TouchableOpacity>
      </View>
    </View>
  );
};

export default function MapaNavegacionScreen({ navigation }: any) {
  const [location, setLocation] = React.useState<Location.LocationObject | null>(null);
  const [routeInfo, setRouteInfo] = React.useState({ distance: 0, duration: 0 });

  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      
      // Seguimiento en tiempo real
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => setLocation(loc)
      );
      
      return () => subscription.remove();
    })();
  }, []);

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)} min`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h} h ${m} min`;
  };

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

      {/* Route progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '45%' }]} />
        <Text style={styles.progressLabel}>
          {routeInfo.distance.toFixed(1)} km totales · {formatDuration(routeInfo.duration)} estimados
        </Text>
      </View>

      {/* Map */}
      <OperativeMap 
        location={location} 
        onRouteReady={(result) => setRouteInfo({ distance: result.distance, duration: result.duration })}
      />

      {/* Bottom info */}
      <View style={styles.bottomPanel}>
        <View style={styles.infoGrid}>
          {[
            { label: 'PRÓXIMA PARADA', val: 'Terminal Riobamba', icon: 'flag-outline' },
            { label: 'DISTANCIA', val: `${routeInfo.distance.toFixed(1)} km`, icon: 'navigate-outline' },
            { label: 'VELOCIDAD', val: '72 km/h', icon: 'speedometer-outline' },
            { label: 'ETA DESTINO', val: calculateETA(), icon: 'time-outline' },
          ].map((item, i) => (
            <View key={i} style={styles.infoCell}>
              <Ionicons name={item.icon as any} size={16} color={Colors.accent} />
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoVal}>{item.val}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.incidentBtn}
          onPress={() => navigation.navigate('ReporteIncidencias')}
        >
          <Ionicons name="warning-outline" size={18} color={Colors.danger} />
          <Text style={styles.incidentBtnText}>Reportar Incidencia</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, paddingTop: 52, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  headerSub: { fontSize: 12, color: Colors.textMuted },
  gpsOnBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#DCFCE7', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5,
  },
  gpsDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  gpsOnText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  progressBar: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  progressFill: {
    height: 3, width: '68%', backgroundColor: Colors.accent, borderRadius: 2, marginBottom: 4,
  },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  mapContainer: { flex: 1, position: 'relative', backgroundColor: '#B8CBD9', overflow: 'hidden' },
  mapBg: { ...StyleSheet.absoluteFillObject },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  routePath: {
    position: 'absolute', width: 4, height: '120%', backgroundColor: Colors.accent,
    left: '40%', top: -10, transform: [{ rotate: '12deg' }], opacity: 0.8,
  },
  startPoint: {
    position: 'absolute', top: 30, left: '36%',
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  startPointText: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  busMarker: {
    position: 'absolute', bottom: '40%', left: '42%',
    width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', ...Shadow.md,
  },
  zoomControls: { position: 'absolute', right: Spacing.md, bottom: 80 },
  zoomBtn: {
    width: 42, height: 42, borderRadius: Radius.md, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4, ...Shadow.sm,
  },
  bottomPanel: { backgroundColor: Colors.white, padding: Spacing.lg, ...Shadow.lg },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md },
  infoCell: { width: '50%', paddingVertical: 8, paddingRight: 8 },
  infoLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5, marginVertical: 3 },
  infoVal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  incidentBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: Radius.md, padding: 14,
    backgroundColor: '#FEF2F2',
  },
  incidentBtnText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});
