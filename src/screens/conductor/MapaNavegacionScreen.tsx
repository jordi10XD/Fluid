import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

// Fake map for driver
const OperativeMap = () => (
  <View style={styles.mapContainer}>
    <View style={styles.mapBg}>
      {[...Array(10)].map((_, i) => (
        <View key={`h${i}`} style={[styles.gridH, { top: i * 50 }]} />
      ))}
      {[...Array(7)].map((_, i) => (
        <View key={`v${i}`} style={[styles.gridV, { left: i * 54 }]} />
      ))}
      {/* Route path */}
      <View style={styles.routePath} />
      {/* Start point */}
      <View style={styles.startPoint}>
        <Text style={styles.startPointText}>A</Text>
      </View>
      {/* Bus */}
      <View style={styles.busMarker}>
        <Ionicons name="bus" size={18} color={Colors.white} />
      </View>
    </View>
    <View style={styles.zoomControls}>
      <TouchableOpacity style={styles.zoomBtn}><Ionicons name="add" size={20} color={Colors.textPrimary} /></TouchableOpacity>
      <TouchableOpacity style={styles.zoomBtn}><Ionicons name="remove" size={20} color={Colors.textPrimary} /></TouchableOpacity>
    </View>
  </View>
);

export default function MapaNavegacionScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>MAPA OPERATIVO</Text>
          <Text style={styles.headerSub}>Quito → Guayaquil · BUS-402</Text>
        </View>
        <View style={styles.gpsOnBadge}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsOnText}>GPS ON</Text>
        </View>
      </View>

      {/* Route progress bar */}
      <View style={styles.progressBar}>
        <View style={styles.progressFill} />
        <Text style={styles.progressLabel}>68% completado · 148 km restantes</Text>
      </View>

      {/* Map */}
      <OperativeMap />

      {/* Bottom info */}
      <View style={styles.bottomPanel}>
        <View style={styles.infoGrid}>
          {[
            { label: 'PRÓXIMA PARADA', val: 'Latacunga Terminal', icon: 'flag-outline' },
            { label: 'DISTANCIA', val: '42 km', icon: 'navigate-outline' },
            { label: 'VELOCIDAD', val: '72 km/h', icon: 'speedometer-outline' },
            { label: 'ETA DESTINO', val: '14:30', icon: 'time-outline' },
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
