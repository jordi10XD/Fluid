import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';

// ─── Types ────────────────────────────────────────────────────────────────────
type ScheduleStatus = 'OPERATIVO' | 'CANCELADO' | 'EN PROCESO';

interface Schedule {
  id: string; time: string; route: string; highway: string;
  bus: string; driver: string; status: ScheduleStatus; next?: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<ScheduleStatus, string> = {
  'OPERATIVO':  Colors.success,
  'CANCELADO':  Colors.danger,
  'EN PROCESO': Colors.warning,
};

const INITIAL_SCHEDULES: Schedule[] = [
  { id: 's1', time: '08:15', route: 'Quito — Guayaquil',    highway: 'TRONCAL PRINCIPAL E35',         bus: 'BUS-402', driver: 'Carlos Rivadeneira', status: 'OPERATIVO' },
  { id: 's2', time: '09:45', route: 'Cuenca — Loja',        highway: 'INTERRUPCIÓN DE VÍA',           bus: 'BUS-115', driver: 'Marco Tulio',         status: 'CANCELADO' },
  { id: 's3', time: '11:00', route: 'Manta — Portoviejo',   highway: 'SERVICIO EXPRESO',              bus: 'BUS-088', driver: 'Luis Anchundía',       status: 'OPERATIVO' },
  { id: 's4', time: '12:30', route: 'Ambato — Baños',       highway: 'PROTOCOLO RF-G04 VALIDADO',     bus: 'BUS-205', driver: 'Elena Pazmiño',        status: 'EN PROCESO', next: true },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function GestionHorariosScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);

  // Form fields
  const [fTime,    setFTime]    = useState('');
  const [fRoute,   setFRoute]   = useState('');
  const [fHighway, setFHighway] = useState('');
  const [fBus,     setFBus]     = useState('');
  const [fDriver,  setFDriver]  = useState('');

  const resetForm = () => { setFTime(''); setFRoute(''); setFHighway(''); setFBus(''); setFDriver(''); setEditId(null); setShowForm(false); };

  const openEdit = (s: Schedule) => {
    setFTime(s.time); setFRoute(s.route); setFHighway(s.highway);
    setFBus(s.bus); setFDriver(s.driver); setEditId(s.id); setShowForm(true);
  };

  /** TODO: replace with `supabase.from('horarios').insert(...)` or `.update(...)` */
  const handleSave = () => {
    if (!fTime || !fRoute || !fBus || !fDriver) {
      Alert.alert('Campos requeridos', 'Completa hora, ruta, bus y conductor.');
      return;
    }
    if (editId) {
      setSchedules(prev => prev.map(s => s.id === editId ? { ...s, time: fTime, route: fRoute, highway: fHighway, bus: fBus, driver: fDriver } : s));
    } else {
      const newS: Schedule = { id: `s${Date.now()}`, time: fTime, route: fRoute, highway: fHighway, bus: fBus, driver: fDriver, status: 'EN PROCESO' };
      setSchedules(prev => [...prev, newS]);
    }
    resetForm();
  };

  /** TODO: replace with `supabase.from('horarios').delete().eq('id', id)` */
  const handleDelete = (id: string) => {
    Alert.alert('Eliminar horario', '¿Confirmas que deseas eliminar este horario?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setSchedules(prev => prev.filter(s => s.id !== id)) },
    ]);
  };

  // Stats derived from data
  const operativos = schedules.filter(s => s.status === 'OPERATIVO').length;
  const cancelados = schedules.filter(s => s.status === 'CANCELADO').length;
  const nextSchedule = schedules.find(s => s.next);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSup}>PANEL DE CONTROL LOGÍSTICO</Text>
          <Text style={styles.pageTitle}>Gestión de Horarios</Text>
          <Text style={styles.pageDesc}>Lista maestra de salidas diarias — Protocolo RF-G04</Text>
        </View>
      </View>

      {/* ── Stats row (FIXED: antes estaban apilados verticalmente) ──────
        FIX: los statCard tenían marginBottom individual dentro de un contenedor
        sin flex:row, lo que los apilaba en lugar de mostrarse horizontalmente.
        Ahora usan flexDirection:'row' explícito con flex:1 en cada tarjeta.
      ─────────────────────────────────────────────────────────────────── */}
      <View style={styles.statsOuter}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>OPERATIVOS HOY</Text>
          <Text style={[styles.statVal, { color: Colors.success }]}>{operativos}</Text>
          <Text style={styles.statSub}>de {schedules.length} programados</Text>
        </View>
        <View style={[styles.statCard, styles.statCardDanger]}>
          <Text style={[styles.statLabel, { color: Colors.danger }]}>CANCELADOS</Text>
          <Text style={[styles.statVal, { color: Colors.danger }]}>{cancelados < 10 ? `0${cancelados}` : cancelados}</Text>
          <Text style={styles.statSub}>Protocolo RF</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>PRÓXIMA SALIDA</Text>
          <Text style={styles.statVal}>{nextSchedule?.time ?? '--:--'}</Text>
          <Text style={styles.statSub} numberOfLines={1}>{nextSchedule?.route ?? '—'}</Text>
        </View>
      </View>

      {/* ── Create / Edit form ───────────────────────────────────────────
        FIX: el original tenía un botón "Crear Nuevo Horario" Y un FAB que
        hacían lo mismo. Se unificó en un solo botón y se eliminó el FAB
        duplicado.
      ─────────────────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.createBtn, showForm && styles.createBtnCancel]}
        onPress={() => { if (showForm) resetForm(); else setShowForm(true); }}
      >
        <Ionicons name={showForm ? 'close' : 'add'} size={18} color={Colors.white} />
        <Text style={styles.createBtnText}>{showForm ? (editId ? 'Cancelar Edición' : 'Cancelar') : 'Crear Nuevo Horario'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editId ? 'Editar Horario' : 'Nuevo Horario'}</Text>

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>HORA DE SALIDA</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="HH:MM"
                placeholderTextColor={Colors.textMuted}
                value={fTime}
                onChangeText={setFTime}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={{ flex: 2, marginLeft: Spacing.sm }}>
              <Text style={styles.fieldLabel}>RUTA</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ciudad A — Ciudad B"
                placeholderTextColor={Colors.textMuted}
                value={fRoute}
                onChangeText={setFRoute}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>VÍA / PROTOCOLO</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Ej: TRONCAL PRINCIPAL E35"
            placeholderTextColor={Colors.textMuted}
            value={fHighway}
            onChangeText={setFHighway}
            autoCapitalize="characters"
          />

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>BUS</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="BUS-XXX"
                placeholderTextColor={Colors.textMuted}
                value={fBus}
                onChangeText={setFBus}
                autoCapitalize="characters"
              />
            </View>
            <View style={{ flex: 2, marginLeft: Spacing.sm }}>
              <Text style={styles.fieldLabel}>CONDUCTOR</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Nombre del conductor"
                placeholderTextColor={Colors.textMuted}
                value={fDriver}
                onChangeText={setFDriver}
                autoCapitalize="words"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="save-outline" size={18} color={Colors.white} />
            <Text style={styles.saveBtnText}>{editId ? 'Actualizar Horario' : 'Guardar Horario'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Reports link ─────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.reportsLink}>
        <Ionicons name="bar-chart-outline" size={18} color={Colors.textMuted} />
        <Text style={styles.reportsText}>Ver Reportes Completos</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* ── Schedule cards ───────────────────────────────────────────── */}
      <View style={styles.scheduleList}>
        {schedules.map((s) => (
          <View
            key={s.id}
            style={[
              styles.scheduleCard,
              s.status === 'CANCELADO' && styles.cardCancelled,
              s.next && styles.cardNext,
            ]}
          >
            {s.next && (
              <View style={styles.nextBadge}>
                <Text style={styles.nextBadgeText}>SIGUIENTE</Text>
              </View>
            )}

            {/* Time + route */}
            <Text style={styles.scheduleTime}>{s.time}</Text>
            <View style={styles.routeRow}>
              <Ionicons name="swap-horizontal" size={14} color={Colors.textSecondary} />
              <Text style={[styles.routeName, s.status === 'CANCELADO' && { color: Colors.danger }]}>
                {s.route}
              </Text>
            </View>
            <Text style={[styles.highway, s.status === 'CANCELADO' && { color: Colors.danger }]}>
              {s.highway}
            </Text>

            {/* Meta row */}
            <View style={styles.metaLine}>
              <Ionicons name="bus-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{s.bus}</Text>
              <View style={styles.metaDivider} />
              <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{s.driver}</Text>
            </View>

            {/* Status + actions */}
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[s.status] + '18', borderColor: STATUS_COLOR[s.status] }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[s.status] }]} />
                <Text style={[styles.statusText, { color: STATUS_COLOR[s.status] }]}>{s.status}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(s)}>
                  <Ionicons name="pencil-outline" size={15} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={() => handleDelete(s.id)}>
                  <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Pagination */}
      <View style={styles.pagination}>
        <Text style={styles.paginationText}>Mostrando {schedules.length} salidas programadas</Text>
        <TouchableOpacity style={styles.nextPageBtn}>
          <Ionicons name="chevron-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary,
    paddingTop: 52, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg,
  },
  headerSup: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  pageDesc:  { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  // Stats — horizontal flex row (fix)
  statsOuter: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.sm, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  statCardDanger: { borderColor: Colors.danger + '40' },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  statVal:   { fontSize: 26, fontWeight: '900', color: Colors.textPrimary },
  statSub:   { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

  // Create button
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    backgroundColor: Colors.primary, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    borderRadius: Radius.md, padding: 13,
  },
  createBtnCancel: { backgroundColor: Colors.textSecondary },
  createBtnText:   { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // Form
  form: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.md, ...Shadow.md, borderWidth: 1, borderColor: Colors.primaryLight + '25',
  },
  formTitle:  { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  formRow:    { flexDirection: 'row', marginBottom: 0 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 5 },
  fieldInput: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
    fontSize: 14, color: Colors.textPrimary, marginBottom: Spacing.sm,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 13, marginTop: 4,
  },
  saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // Reports
  reportsLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: Radius.md, padding: 12,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  reportsText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },

  // Schedule cards
  scheduleList:    { paddingHorizontal: Spacing.lg },
  scheduleCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm,
    position: 'relative', overflow: 'hidden',
  },
  cardCancelled:   { borderLeftWidth: 4, borderLeftColor: Colors.danger },
  cardNext:        { borderWidth: 2, borderColor: Colors.primary },
  nextBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.primary, borderBottomLeftRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  nextBadgeText:   { fontSize: 9, color: Colors.white, fontWeight: '800', letterSpacing: 1 },
  scheduleTime:    { fontSize: 22, fontWeight: '900', color: Colors.textPrimary, marginBottom: 4 },
  routeRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  routeName:       { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  highway:         { fontSize: 11, color: Colors.textSecondary, marginBottom: 8 },
  metaLine:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  metaText:        { fontSize: 12, color: Colors.textSecondary },
  metaDivider:     { width: 1, height: 12, backgroundColor: Colors.border, marginHorizontal: 4 },
  statusRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot:       { width: 6, height: 6, borderRadius: 3 },
  statusText:      { fontSize: 11, fontWeight: '700' },
  actions:         { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: Radius.sm,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  actionDanger:    { backgroundColor: Colors.danger + '12' },

  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl,
  },
  paginationText:  { fontSize: 12, color: Colors.textMuted },
  nextPageBtn: {
    width: 38, height: 38, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
});
