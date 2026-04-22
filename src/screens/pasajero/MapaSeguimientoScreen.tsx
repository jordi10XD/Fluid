import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

// Grid lines for the fake map
const MapPlaceholder = () => (
  <View style={styles.mapContainer}>
    {/* Fake map with grid lines */}
    <View style={styles.mapBg}>
      {[...Array(12)].map((_, i) => (
        <View key={`h${i}`} style={[styles.gridLineH, { top: (i + 1) * 50 }]} />
      ))}
      {[...Array(8)].map((_, i) => (
        <View key={`v${i}`} style={[styles.gridLineV, { left: (i + 1) * 50 }]} />
      ))}
      {/* Diagonal road lines */}
      <View style={styles.road1} />
      <View style={styles.road2} />
    </View>
    {/* Bus marker */}
    <View style={styles.busMarker}>
      <View style={styles.busLabel}>
        <View style={styles.activeDot} />
        <Text style={styles.busLabelText}>UNIT 402</Text>
      </View>
      <View style={styles.busIcon}>
        <Ionicons name="bus" size={22} color={Colors.white} />
        <View style={styles.dirDot} />
      </View>
    </View>
    {/* Zoom controls */}
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
);

export default function MapaSeguimientoScreen({ navigation }: any) {
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
      <MapPlaceholder />

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
  mapContainer: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#B8CBD9' },
  mapBg: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  road1: {
    position: 'absolute', width: 3, height: 500, backgroundColor: 'rgba(255,255,255,0.6)',
    top: 0, left: '40%', transform: [{ rotate: '20deg' }],
  },
  road2: {
    position: 'absolute', width: 3, height: 500, backgroundColor: 'rgba(255,255,255,0.5)',
    top: 100, left: '20%', transform: [{ rotate: '-15deg' }],
  },
  busMarker: { position: 'absolute', bottom: 160, left: '45%' },
  busLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, marginBottom: 4,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  busLabelText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  busIcon: {
    width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  dirDot: {
    position: 'absolute', bottom: -4, right: -4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.accent, borderWidth: 2, borderColor: Colors.white,
  },
  zoomControls: { position: 'absolute', right: Spacing.md, bottom: 200 },
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
