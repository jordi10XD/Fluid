import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

const { width, height } = Dimensions.get('window');



export default function MapaSeguimientoScreen({ navigation }: any) {
  const [buses, setBuses] = useState<any[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();

    const fetchBuses = async () => {
      const { data, error } = await supabase.from('live_bus_locations').select('*');
      if (!error && data) {
        setBuses(data);
      }
    };

    fetchBuses();
    const interval = setInterval(fetchBuses, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RASTREO DE BUSES</Text>
        <TouchableOpacity>
          <Ionicons name="person-circle-outline" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          showsUserLocation
          initialRegion={{
            latitude: location ? location.coords.latitude : -1.9,
            longitude: location ? location.coords.longitude : -79.1,
            latitudeDelta: 1.5,
            longitudeDelta: 1.5,
          }}
        >
          {buses.map((bus, i) => (
            <Marker
              key={i}
              coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
              title={`Unidad ${bus.internal_number || bus.plate_number}`}
              description={`Velocidad: ${bus.speed_kmh} km/h`}
            >
              <View style={styles.busMarkerLive}>
                <Ionicons name="bus" size={20} color={Colors.white} />
              </View>
            </Marker>
          ))}
        </MapView>
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.zoomBtn}>
            <Ionicons name="add" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn}>
            <Ionicons name="remove" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Telemetry card */}
        <View style={styles.telCard}>
          <View style={styles.telHeader}>
            <Text style={styles.telTitle}>TELEMETRÍA RF-G04</Text>
            <View style={styles.telDot} />
          </View>
          <View style={styles.telRow}>
            <Text style={styles.telLabel}>Velocidad</Text>
            <Text style={styles.telVal}>72 <Text style={styles.telUnit}>km/h</Text></Text>
          </View>
          <View style={styles.telRow}>
            <Text style={styles.telLabel}>Altitud</Text>
            <Text style={styles.telVal}>2,850 <Text style={styles.telUnit}>msnm</Text></Text>
          </View>
        </View>
        {/* GPS badge */}
        <View style={styles.gpsBadge}>
          <Ionicons name="radio-outline" size={14} color={Colors.white} />
          <Text style={styles.gpsText}>PRECISIÓN CINÉTICA · GPS: 0.8m (Active)</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.routeRow}>
          <View>
            <Text style={styles.routeLabel}>RUTA EN CURSO</Text>
            <Text style={styles.routeName}>Quito — Guayaquil</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.etaLabel}>ETA DINÁMICO</Text>
            <Text style={styles.etaVal}>Llegada en 15 min</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBg}>
          <View style={styles.progressFill} />
        </View>
        <View style={styles.terminalRow}>
          <View>
            <Text style={styles.terminalLabel}>ORIGEN</Text>
            <Text style={styles.terminalName}>Terminal Quitumbe</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.terminalLabel}>DESTINO</Text>
            <Text style={styles.terminalName}>Terminal Pascuales</Text>
          </View>
        </View>
        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.assistBtn}>
            <Ionicons name="help-circle-outline" size={18} color={Colors.white} />
            <Text style={styles.assistText}>Solicitar Asistencia</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingTop: 52, paddingBottom: Spacing.md,
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  // Map
  mapContainer: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: Colors.background },
  busMarkerLive: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white,
    ...Shadow.sm,
  },
  zoomControls: { position: 'absolute', right: Spacing.md, bottom: Spacing.xl },
  zoomBtn: {
    width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4, ...Shadow.sm,
  },
  telCard: {
    position: 'absolute', top: Spacing.md, left: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: Radius.lg,
    padding: Spacing.md, width: 180, ...Shadow.md,
  },
  telHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  telTitle: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  telDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  telRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  telLabel: { fontSize: 13, color: Colors.textSecondary },
  telVal: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  telUnit: { fontSize: 12, fontWeight: '400' },
  gpsBadge: {
    position: 'absolute', bottom: Spacing.md, left: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  gpsText: { fontSize: 10, color: Colors.white, fontWeight: '600', letterSpacing: 0.5 },

  // Bottom sheet
  bottomSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, ...Shadow.lg,
  },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  routeLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  routeName: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  etaLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, textAlign: 'right' },
  etaVal: { fontSize: 22, fontWeight: '800', color: Colors.primary, textAlign: 'right' },
  progressBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: Spacing.md },
  progressFill: { width: '75%', height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  terminalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  terminalLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', letterSpacing: 1, marginBottom: 3 },
  terminalName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  assistBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 16,
  },
  assistText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  shareBtn: {
    width: 52, height: 52, borderRadius: Radius.md, backgroundColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
});
