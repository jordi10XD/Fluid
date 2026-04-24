import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

// Admin map
const AdminMap = () => (
  <View style={styles.mapArea}>
    <MapView
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude: -1.6669,  // Approx Riobamba
        longitude: -78.6536,
        latitudeDelta: 2.0, // Zoom out to see Riobamba - Guayaquil
        longitudeDelta: 2.0,
      }}
    >
      {/* Bus markers */}
      {[{ id: '312', lat: -2.1894, lng: -79.8891 }, { id: '402', lat: -1.6669, lng: -78.6536 }].map((bus) => (
        <Marker 
          key={bus.id} 
          coordinate={{ latitude: bus.lat, longitude: bus.lng }}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={styles.busLabel}>
              <Text style={styles.busLabelText}>UNIDAD {bus.id}</Text>
            </View>
            <View style={styles.busIcon}>
              <Ionicons name="bus" size={18} color={Colors.white} />
            </View>
          </View>
        </Marker>
      ))}
    </MapView>

    {/* Telemetry overlay */}
    <View style={styles.telOverlay}>
      <View style={styles.telHeader}>
        <Text style={styles.telTitle}>TELEMETRÍA DE RED</Text>
        <View style={styles.telDot} />
      </View>
      <View style={styles.telRow}>
        <View style={styles.telCell}>
          <Text style={styles.telLabel}>LATENCIA</Text>
          <Text style={styles.telVal}>24ms</Text>
        </View>
        <View style={styles.telSep} />
        <View style={styles.telCell}>
          <Text style={styles.telLabel}>CARGA</Text>
          <Text style={styles.telVal}>89%</Text>
        </View>
      </View>
    </View>

    {/* Zoom Controls */}
    <View style={styles.zoomControls}>
      <TouchableOpacity style={styles.zoomBtn}><Ionicons name="add" size={20} color={Colors.textPrimary} /></TouchableOpacity>
      <TouchableOpacity style={styles.zoomBtn}><Ionicons name="remove" size={20} color={Colors.textPrimary} /></TouchableOpacity>
    </View>
    <TouchableOpacity style={styles.centerBtn}>
      <Ionicons name="locate" size={20} color={Colors.white} />
    </TouchableOpacity>
  </View>
);

export default function PanelGlobalMonitoreoScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel de Monitoreo</Text>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={18} color={Colors.white} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <AdminMap />

        {/* Stats */}
        <View style={styles.statsGrid}>
          {/* Active buses */}
          <View style={[styles.statCard, styles.statCardDark]}>
            <View style={styles.statCardHeader}>
              <Ionicons name="radio-outline" size={16} color={Colors.accentLight} />
              <Text style={styles.statCardLabel}>BUSES ACTIVOS</Text>
            </View>
            <Text style={styles.statCardNum}>24</Text>
            <Text style={styles.statCardTrend}>↗ +2 desde última hora</Text>
            <Ionicons name="bus" size={70} color="rgba(255,255,255,0.08)" style={styles.watermark} />
          </View>

          {/* Delays */}
          <View style={[styles.statCard, { borderLeftColor: Colors.warning, borderLeftWidth: 4 }]}>
            <View style={styles.statCardHeader}>
              <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.statCardLabel}>RETRASOS DETECTADOS</Text>
            </View>
            <Text style={[styles.statCardNum, { color: Colors.textPrimary }]}>03</Text>
            <View style={styles.requiresBadge}>
              <Text style={styles.requiresBadgeText}>Requiere Atención</Text>
            </View>
          </View>

          {/* Critical alerts */}
          <View style={[styles.statCard, { borderTopColor: Colors.danger, borderTopWidth: 3, paddingTop: Spacing.md }]}>
            <View style={styles.statCardHeader}>
              <Ionicons name="warning-outline" size={16} color={Colors.danger} />
              <Text style={[styles.statCardLabel, { color: Colors.danger }]}>ALERTAS CRÍTICAS</Text>
            </View>
            <Text style={[styles.statCardNum, { color: Colors.danger }]}>01</Text>
            <TouchableOpacity style={styles.alertDetailBtn}>
              <Text style={styles.alertDetailText}>VER DETALLES DE ALERTA</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  mapArea: { height: 280, backgroundColor: '#B8CBD9', position: 'relative', overflow: 'hidden' },
  mapBg: { ...StyleSheet.absoluteFillObject },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  telOverlay: {
    position: 'absolute', top: Spacing.md, left: Spacing.md, right: '35%',
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm,
  },
  telHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  telTitle: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  telDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  telRow: { flexDirection: 'row' },
  telCell: { flex: 1, alignItems: 'center' },
  telSep: { width: 1, backgroundColor: Colors.border },
  telLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  telVal: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  busMarkerWrap: { position: 'absolute' },
  busLabel: { backgroundColor: Colors.white, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 3, ...Shadow.sm },
  busLabelText: { fontSize: 10, fontWeight: '700', color: Colors.textPrimary },
  busIcon: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  zoomControls: { position: 'absolute', right: Spacing.md, bottom: 50 },
  zoomBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 4, ...Shadow.sm },
  centerBtn: { position: 'absolute', right: Spacing.md, bottom: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { padding: Spacing.lg, gap: Spacing.md },
  statCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadow.sm, overflow: 'hidden', position: 'relative' },
  statCardDark: { backgroundColor: Colors.primary },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  statCardLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
  statCardNum: { fontSize: 48, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  statCardTrend: { fontSize: 13, color: Colors.success, fontWeight: '600' },
  watermark: { position: 'absolute', right: -10, bottom: -10 },
  requiresBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 8 },
  requiresBadgeText: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  alertDetailBtn: { backgroundColor: Colors.danger, borderRadius: Radius.md, padding: 12, alignItems: 'center', marginTop: 12 },
  alertDetailText: { color: Colors.white, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});
