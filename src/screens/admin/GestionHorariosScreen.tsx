import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

const SCHEDULES = [
  { time: '08:15', route: 'Quito — Guayaquil', highway: 'TRONCAL PRINCIPAL E35', bus: 'BUS-402', driver: 'Carlos Rivadeneira', status: 'OPERATIVO', statusColor: Colors.success },
  { time: '09:45', route: 'Cuenca — Loja', highway: 'INTERRUPCIÓN DE VÍA', bus: 'BUS-115', driver: 'Marco Tulio', status: 'CANCELADO', statusColor: Colors.danger, alert: true },
  { time: '11:00', route: 'Manta — Portoviejo', highway: 'SERVICIO EXPRESO', bus: 'BUS-088', driver: 'Luis Anchundía', status: 'OPERATIVO', statusColor: Colors.success },
  { time: '12:30', route: 'Ambato — Baños', highway: 'PROTOCOLO RF-G04 VALIDADO', bus: 'BUS-205', driver: 'Elena Pazmiño', status: 'EN PROCESO', statusColor: Colors.warning, next: true },
];

export default function GestionHorariosScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={26} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={styles.headerSup}>PANEL DE CONTROL LOGÍSTICO</Text>
          <Text style={styles.pageTitle}>Gestión de Horarios</Text>
          <Text style={styles.pageDesc}>Lista maestra de salidas diarias bajo Protocolo RF-G04</Text>
        </View>
      </View>

      {/* Create button */}
      <TouchableOpacity style={styles.createBtn}>
        <Ionicons name="add" size={20} color={Colors.white} />
        <Text style={styles.createBtnText}>Crear Nuevo Horario</Text>
      </TouchableOpacity>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[
          { label: 'OPERATIVOS HOY', val: '24', sub: '+2%', color: Colors.textPrimary },
          { label: 'CANCELADOS', val: '02', sub: 'Protocolo RF', color: Colors.danger },
          { label: 'SIGUIENTE SALIDA', val: '14:30', sub: 'Quito - Guayaquil', color: Colors.textPrimary },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val} {i === 0 && <Text style={styles.statSub}>{s.sub}</Text>}</Text>
            {i !== 0 && <Text style={styles.statSub}>{s.sub}</Text>}
          </View>
        ))}
      </View>

      {/* Reports link */}
      <TouchableOpacity style={styles.reportsLink}>
        <Ionicons name="bar-chart-outline" size={22} color={Colors.textMuted} />
        <Text style={styles.reportsText}>Ver Reportes</Text>
      </TouchableOpacity>

      {/* Schedule list */}
      <View style={styles.scheduleList}>
        {SCHEDULES.map((s, i) => (
          <View
            key={i}
            style={[
              styles.scheduleCard,
              s.alert && styles.scheduleCardAlert,
              s.next && styles.scheduleCardNext,
            ]}
          >
            {s.next && (
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>SIGUIENTE</Text>
              </View>
            )}
            <Text style={styles.scheduleTime}>{s.time}</Text>
            <View style={styles.routeRow}>
              <Ionicons name="swap-horizontal" size={16} color={Colors.textSecondary} />
              <Text style={[styles.routeName, s.alert && styles.routeNameAlert]}>{s.route}</Text>
            </View>
            <Text style={[styles.highway, s.alert && { color: Colors.danger }]}>{s.highway}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="bus-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.metaText}>{s.bus}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.driverAvatar}>
                <Ionicons name="person" size={12} color={Colors.textSecondary} />
              </View>
              <Text style={styles.metaText}>{s.driver}</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: s.statusColor + '20', borderColor: s.statusColor }]}>
                <View style={[styles.statusDot, { backgroundColor: s.statusColor }]} />
                <Text style={[styles.statusText, { color: s.statusColor }]}>{s.status}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="pencil-outline" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.pagination}>
        <Text style={styles.paginationText}>Mostrando 4 de 12 salidas programadas</Text>
        <TouchableOpacity style={styles.nextPageBtn}>
          <Ionicons name="chevron-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={26} color={Colors.white} />
      </TouchableOpacity>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerSup: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  pageDesc: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: Colors.primary, margin: Spacing.lg, borderRadius: Radius.md, padding: 14,
  },
  createBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  statsRow: { paddingHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.sm },
  statCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  statVal: { fontSize: 30, fontWeight: '900', color: Colors.textPrimary },
  statSub: { fontSize: 13, color: Colors.textSecondary, fontWeight: '400' },
  reportsLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: Radius.md, padding: 14, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  reportsText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  scheduleList: { paddingHorizontal: Spacing.lg },
  scheduleCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, ...Shadow.sm, position: 'relative', overflow: 'hidden',
  },
  scheduleCardAlert: { borderLeftWidth: 4, borderLeftColor: Colors.danger },
  scheduleCardNext: { borderWidth: 2, borderColor: Colors.primary },
  nextBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: Colors.primary,
    borderBottomLeftRadius: Radius.md, paddingHorizontal: 10, paddingVertical: 4,
  },
  nextBadgeText: { fontSize: 9, color: Colors.white, fontWeight: '800', letterSpacing: 1 },
  scheduleTime: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  routeName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  routeNameAlert: { color: Colors.danger },
  highway: { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  driverAvatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  paginationText: { fontSize: 12, color: Colors.textMuted },
  nextPageBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute', bottom: 90, right: Spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', ...Shadow.lg,
  },
});
