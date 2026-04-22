import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

export default function DashboardConductorScreen({ navigation }: any) {
  const [timer, setTimer] = useState(8144); // 2:15:44 in seconds

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      {/* Header */}
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

      {/* Route Card */}
      <View style={styles.routeCard}>
        <View style={styles.routeAccent} />
        <View style={styles.routeContent}>
          <Text style={styles.routeLabel}>RUTA ACTUAL</Text>
          <Text style={styles.routeTitle}>Quito — Guayaquil</Text>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="time-outline" size={20} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.statLabel}>TIEMPO ESTIMADO</Text>
                <Text style={styles.statVal}>07:45 H</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="location-outline" size={20} color={Colors.success} />
              </View>
              <View>
                <Text style={styles.statLabel}>DISTANCIA TOTAL</Text>
                <Text style={styles.statVal}>424 KM</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
              </View>
              <View>
                <Text style={styles.statLabel}>ESTADO PROTOCOLO</Text>
                <Text style={[styles.statVal, { color: Colors.accent, fontSize: 13 }]}>RF-G04 ACTIVO</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Map Preview */}
      <View style={styles.mapPreview}>
        <View style={styles.mapBg}>
          {[...Array(8)].map((_, i) => (
            <View key={`h${i}`} style={[styles.gridH, { top: i * 40 }]} />
          ))}
          {/* Route line */}
          <View style={styles.routeLine} />
        </View>
        <View style={styles.gpsBadge}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsText}>UBICACIÓN GPS</Text>
          <Text style={styles.transmitText}>● TRANSMITIENDO</Text>
        </View>
      </View>

      {/* Telemetry Grid */}
      <View style={styles.telGrid}>
        {[
          { icon: 'cellular', label: 'CONEXIÓN SATELITAL', val: '98%', sub: 'Estable' },
          { icon: 'locate-outline', label: 'ESTADO GPS', val: 'ACTIVO', sub: 'Precision 2m' },
          { icon: 'stopwatch-outline', label: 'TIEMPO DE CONDUCCIÓN', val: formatTimer(timer), sub: '' },
          { icon: 'speedometer-outline', label: 'VELOCIDAD ACTUAL', val: '72', sub: 'km/h' },
        ].map((t, i) => (
          <View key={i} style={styles.telCell}>
            <Ionicons name={t.icon as any} size={22} color={Colors.textSecondary} style={{ marginBottom: 6 }} />
            <Text style={styles.telLabel}>{t.label}</Text>
            <Text style={styles.telVal}>{t.val} <Text style={styles.telSub}>{t.sub}</Text></Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('MapaNavegacion')}>
        <Ionicons name="play" size={22} color={Colors.white} />
        <View>
          <Text style={styles.actionBtnMain}>INICIAR RUTA</Text>
          <Text style={styles.actionBtnSub}>ACTIVAR PROTOCOLO RF-G04</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.endBtn}>
        <Ionicons name="stop" size={22} color={Colors.textSecondary} />
        <View>
          <Text style={styles.endBtnMain}>FINALIZAR RUTA</Text>
          <Text style={styles.endBtnSub}>CIERRE DE BITÁCORA TÉCNICA</Text>
        </View>
      </TouchableOpacity>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.lg,
    paddingTop: 52, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBrand: { fontSize: 16, fontWeight: '900', color: Colors.primary, letterSpacing: 1 },
  unitId: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
  routeCard: {
    margin: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border, flexDirection: 'row',
  },
  routeAccent: { width: 5, backgroundColor: Colors.accent },
  routeContent: { flex: 1, padding: Spacing.md },
  routeLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 1, fontWeight: '600', marginBottom: 4 },
  routeTitle: { fontSize: 22, fontWeight: '800', color: Colors.primary, marginBottom: Spacing.md },
  statRow: { gap: Spacing.sm },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statIconBox: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5, fontWeight: '600' },
  statVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  mapPreview: { marginHorizontal: Spacing.lg, height: 160, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#B8CBD9', marginBottom: Spacing.lg },
  mapBg: { ...StyleSheet.absoluteFillObject },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  routeLine: {
    position: 'absolute', width: 3, height: 200, backgroundColor: Colors.accent,
    left: '45%', top: -20, transform: [{ rotate: '10deg' }],
  },
  gpsBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: 6 },
  gpsText: { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  transmitText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  telGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  telCell: {
    width: '50%', padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  telLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 0.5, fontWeight: '600', marginBottom: 4 },
  telVal: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  telSub: { fontSize: 13, fontWeight: '400', color: Colors.textSecondary },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.sm, ...Shadow.md,
  },
  actionBtnMain: { color: Colors.white, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  actionBtnSub: { color: 'rgba(255,255,255,0.65)', fontSize: 11, letterSpacing: 0.5 },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.borderLight, marginHorizontal: Spacing.lg, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  endBtnMain: { color: Colors.textSecondary, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  endBtnSub: { color: Colors.textMuted, fontSize: 11 },
});
