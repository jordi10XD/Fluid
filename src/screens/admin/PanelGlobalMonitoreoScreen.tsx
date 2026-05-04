import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────
type BusStatus = 'active' | 'delayed' | 'stopped';
type AlertSeverity = 'critical' | 'warning' | 'info';

interface BusData    { id: string; lat: number; lng: number; route: string; status: BusStatus }
interface AlertItem  { id: string; message: string; severity: AlertSeverity; time: string }
interface ActiveRoute { id: string; name: string; buses: number; progress: number }

// ─── Mock data (replace with Supabase realtime subscriptions) ─────────────────
const BUSES: BusData[] = [
  { id: '312', lat: -2.1894, lng: -79.8891, route: 'R-012', status: 'active' },
  { id: '402', lat: -1.6669, lng: -78.6536, route: 'R-001', status: 'active' },
  { id: '115', lat: -0.2295, lng: -78.5243, route: 'R-001', status: 'delayed' },
];

const ALERTS: AlertItem[] = [
  { id: '1', message: 'Unidad 115 lleva 18 min de retraso en R-001', severity: 'critical', time: 'Hace 3 min' },
  { id: '2', message: 'Desvío en Troncal E35 — km 45', severity: 'warning', time: 'Hace 11 min' },
  { id: '3', message: 'Unidad 402 completó recorrido exitosamente', severity: 'info', time: 'Hace 20 min' },
];

const ACTIVE_ROUTES: ActiveRoute[] = [
  { id: 'R-001', name: 'Quito — Riobamba', buses: 3, progress: 68 },
  { id: 'R-012', name: 'Guayaquil — Salinas', buses: 2, progress: 41 },
];

const BUS_COLOR: Record<BusStatus, string> = {
  active:  Colors.success,
  delayed: Colors.warning,
  stopped: Colors.danger,
};

const ALERT_CFG: Record<AlertSeverity, { bg: string; border: string; icon: any; color: string }> = {
  critical: { bg: '#FFF1F2', border: Colors.danger,  icon: 'alert-circle',       color: Colors.danger },
  warning:  { bg: '#FFFBEB', border: Colors.warning,  icon: 'warning',            color: Colors.warning },
  info:     { bg: '#F0F9FF', border: Colors.accent,   icon: 'information-circle', color: Colors.accent },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Live indicator dot + label */
const LiveBadge = () => (
  <View style={styles.liveBadge}>
    <View style={styles.liveDot} />
    <Text style={styles.liveText}>EN VIVO</Text>
  </View>
);

interface StatCardProps {
  icon: any; label: string; value: string;
  sub?: string; accent?: string; dark?: boolean;
}

/**
 * FIX: el original tenía statCardLabel con color `rgba(255,255,255,0.7)` hardcodeado,
 * haciéndolo invisible en tarjetas de fondo blanco. Ahora el color es dinámico
 * según la prop `dark`.
 */
const StatCard = ({ icon, label, value, sub, accent, dark = false }: StatCardProps) => (
  <View style={[styles.statCard, dark && styles.statCardDark]}>
    <View style={styles.statTop}>
      <View style={[styles.statIconBox, { backgroundColor: dark ? 'rgba(255,255,255,0.12)' : Colors.background }]}>
        <Ionicons name={icon} size={15} color={accent ?? (dark ? Colors.accentLight : Colors.textSecondary)} />
      </View>
      <Text style={[styles.statLabel, { color: dark ? 'rgba(255,255,255,0.6)' : Colors.textMuted }]}>
        {label}
      </Text>
    </View>
    <Text style={[styles.statValue, { color: dark ? Colors.white : (accent ?? Colors.textPrimary) }]}>
      {value}
    </Text>
    {sub ? (
      <Text style={[styles.statSub, { color: dark ? 'rgba(255,255,255,0.5)' : Colors.textSecondary }]}>
        {sub}
      </Text>
    ) : null}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PanelGlobalMonitoreoScreen() {
  const [selectedBus, setSelectedBus] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSup}>PANEL DE CONTROL LOGÍSTICO</Text>
          <Text style={styles.headerTitle}>Monitoreo Global</Text>
        </View>
        <View style={styles.headerRight}>
          <LiveBadge />
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={16} color={Colors.white} />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Map ──────────────────────────────────────────────────────────── */}
        <View style={styles.mapArea}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{ latitude: -1.6669, longitude: -78.6536, latitudeDelta: 2.2, longitudeDelta: 2.2 }}
          >
            {BUSES.map((bus) => (
              <Marker
                key={bus.id}
                coordinate={{ latitude: bus.lat, longitude: bus.lng }}
                onPress={() => setSelectedBus(bus.id === selectedBus ? null : bus.id)}
              >
                <View style={styles.markerWrap}>
                  {selectedBus === bus.id && (
                    <View style={[styles.markerLabel, { borderColor: BUS_COLOR[bus.status] }]}>
                      <Text style={[styles.markerLabelText, { color: BUS_COLOR[bus.status] }]}>
                        BUS {bus.id} · {bus.route}
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

          {/* Telemetry overlay */}
          <View style={styles.telOverlay}>
            <Text style={styles.telTitle}>TELEMETRÍA</Text>
            <View style={styles.telRow}>
              <View style={styles.telCell}>
                <Text style={styles.telLabel}>LATENCIA</Text>
                <Text style={styles.telVal}>24ms</Text>
              </View>
              <View style={styles.telSep} />
              <View style={styles.telCell}>
                <Text style={styles.telLabel}>SEÑAL</Text>
                <Text style={styles.telVal}>98%</Text>
              </View>
            </View>
          </View>

          {/* Map controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomBtn}>
              <Ionicons name="add" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomBtn}>
              <Ionicons name="remove" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.centerBtn}>
            <Ionicons name="locate" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* ── Stats 2×2 grid ───────────────────────────────────────────────
          FIX: antes las 3 tarjetas apilaban verticalmente con estilos
          inconsistentes. Ahora son un grid 2×2 con colores correctos por rol.
        ──────────────────────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard icon="bus-outline"      label="BUSES ACTIVOS"    value="24" sub="↗ +2 última hora" accent={Colors.success} dark />
            <StatCard icon="time-outline"      label="RETRASOS"         value="03" sub="Requieren atención" accent={Colors.warning} />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="warning-outline"   label="ALERTAS CRÍTICAS" value="01" sub="Ver detalles →" accent={Colors.danger} />
            <StatCard icon="map-outline"        label="RUTAS ACTIVAS"    value="05" sub="De 7 programadas" accent={Colors.accent} />
          </View>
        </View>

        {/* ── Active routes ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="navigate-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>Rutas en Operación</Text>
          </View>
          {ACTIVE_ROUTES.map((route) => (
            <View key={route.id} style={styles.routeCard}>
              <View style={styles.routeTop}>
                <View style={styles.routeBadge}>
                  <Text style={styles.routeBadgeText}>{route.id}</Text>
                </View>
                <Text style={styles.routeName}>{route.name}</Text>
                <View style={styles.busCountBadge}>
                  <Ionicons name="bus" size={11} color={Colors.accent} />
                  <Text style={styles.busCountText}>{route.buses}</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${route.progress}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{route.progress}% del recorrido completado</Text>
            </View>
          ))}
        </View>

        {/* ── Alerts ───────────────────────────────────────────────────────
          MEJORA: antes el botón "VER DETALLES" solo existía para alertas
          críticas. Ahora se muestra contexto visual diferenciado por severidad.
        ──────────────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.sectionTitle}>Alertas Recientes</Text>
          </View>
          {ALERTS.map((alert) => {
            const cfg = ALERT_CFG[alert.severity];
            return (
              <View key={alert.id} style={[styles.alertCard, { backgroundColor: cfg.bg, borderLeftColor: cfg.border }]}>
                <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                <View style={styles.alertBody}>
                  <Text style={[styles.alertMsg, { color: cfg.color }]}>{alert.message}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  headerSup:   { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.white },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },

  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.18)', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  liveText: { fontSize: 10, fontWeight: '800', color: Colors.success, letterSpacing: 0.5 },

  mapArea:   { height: 290, backgroundColor: '#C8D8E8', position: 'relative', overflow: 'hidden' },
  markerWrap: { alignItems: 'center' },
  markerLabel: {
    backgroundColor: Colors.white, borderRadius: Radius.sm, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4, ...Shadow.sm,
  },
  markerLabelText: { fontSize: 10, fontWeight: '700' },
  markerPin: { width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },

  telOverlay: {
    position: 'absolute', top: Spacing.md, left: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: Radius.lg, padding: Spacing.sm, ...Shadow.sm,
  },
  telTitle:  { fontSize: 9, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  telRow:    { flexDirection: 'row' },
  telCell:   { alignItems: 'center', paddingHorizontal: 8 },
  telSep:    { width: 1, backgroundColor: Colors.border },
  telLabel:  { fontSize: 8, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.3, marginBottom: 3 },
  telVal:    { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },

  zoomControls: { position: 'absolute', right: Spacing.md, bottom: 54 },
  zoomBtn: {
    width: 38, height: 38, borderRadius: Radius.md,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    marginBottom: 3, ...Shadow.sm,
  },
  centerBtn: {
    position: 'absolute', right: Spacing.md, bottom: 8,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.md,
  },

  statsGrid: { padding: Spacing.md, gap: Spacing.sm },
  statsRow:  { flexDirection: 'row', gap: Spacing.sm },
  statCard:  { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm },
  statCardDark: { backgroundColor: Colors.primary },
  statTop:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  statIconBox: { width: 26, height: 26, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, flex: 1, flexWrap: 'wrap' },
  statValue: { fontSize: 34, fontWeight: '900', marginBottom: 2 },
  statSub:   { fontSize: 11, fontWeight: '600' },

  section:       { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },

  routeCard:    { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  routeTop:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  routeBadge:   { backgroundColor: Colors.borderLight, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  routeBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  routeName:    { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  busCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF9FC', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  busCountText:  { fontSize: 12, fontWeight: '700', color: Colors.accent },
  progressTrack: { height: 5, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill:  { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: Colors.textMuted },

  alertCard:  {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: Radius.lg, borderLeftWidth: 3,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  alertBody:  { flex: 1 },
  alertMsg:   { fontSize: 13, fontWeight: '600', marginBottom: 3 },
  alertTime:  { fontSize: 11, color: Colors.textMuted },
});
