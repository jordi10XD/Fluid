import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
type UnitStatus = 'EN RUTA' | 'DISPONIBLE' | 'INACTIVO';
type TabKey = 'Unidades' | 'Rutas' | 'Conductores';

interface Unit   { num: string; code: string; model: string; cap: number; status: UnitStatus }
interface Route  { code: string; name: string; stops: { label: string; name: string }[]; km?: string; time?: string }
interface Driver { id: string; name?: string; email: string; phone?: string; unit?: string; status: 'ACTIVO' | 'INACTIVO'; created_at?: string }

// ─── Mock data (replace with Supabase queries for Units/Routes if needed) ─────
const UNITS: Unit[] = [
  { num: '042', code: 'PBA-4509', model: 'Hino Selekt',          cap: 45, status: 'EN RUTA' },
  { num: '118', code: 'PCC-8821', model: 'Mercedes-Benz O500',   cap: 52, status: 'DISPONIBLE' },
  { num: '007', code: 'PDD-3114', model: 'Volvo B430',           cap: 48, status: 'INACTIVO' },
];

const ROUTES: Route[] = [
  {
    code: 'R-001', name: 'MILAGRO — RIOBAMBA',
    stops: [
      { label: 'ORIGEN',             name: 'Milagro — Terminal Terrestre' },
      { label: 'PARADA INTERMEDIA',  name: 'Naranjito — Parada Central' },
      { label: 'DESTINO',            name: 'Riobamba — Terminal Principal' },
    ],
    km: '185', time: '3h 30m',
  },
  {
    code: 'R-002', name: 'RIOBAMBA — MILAGRO (RETORNO)',
    stops: [
      { label: 'ORIGEN',             name: 'Riobamba — Terminal Principal' },
      { label: 'PARADA INTERMEDIA',  name: 'Naranjito — Parada Central' },
      { label: 'DESTINO',            name: 'Milagro — Terminal Terrestre' },
    ],
    km: '185', time: '3h 30m',
  },
];

const STATUS_COLOR: Record<UnitStatus, string> = {
  'EN RUTA':    Colors.success,
  'DISPONIBLE': Colors.accent,
  'INACTIVO':   Colors.danger,
};

const FLEET_STATS = [
  { label: 'En Operación', val: 24, color: Colors.success },
  { label: 'Mantenimiento', val: 8,  color: Colors.accent },
  { label: 'Crítico / Fuera', val: 2, color: Colors.danger },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
interface TabBarProps { active: TabKey; onChange: (t: TabKey) => void }
const TabBar = ({ active, onChange }: TabBarProps) => (
  <View style={styles.tabRow}>
    {(['Unidades', 'Rutas', 'Conductores'] as TabKey[]).map((t) => (
      <TouchableOpacity key={t} style={[styles.tab, active === t && styles.tabActive]} onPress={() => onChange(t)}>
        <Text style={[styles.tabText, active === t && styles.tabTextActive]}>{t}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function GestionUnidadesRutasScreen() {
  const [tab, setTab]           = useState<TabKey>('Unidades');
  const [drivers, setDrivers]   = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch]     = useState('');
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // New driver form state
  const [dEmail, setDEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    const { data, error } = await supabase
      .from('driver_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setDrivers(data.map((d: any) => ({
        id: d.id,
        email: d.email,
        status: 'ACTIVO', // Default status for UI
        created_at: d.created_at
      })));
    }
    setLoadingDrivers(false);
  };

  useEffect(() => {
    if (tab === 'Conductores') {
      fetchDrivers();
    }
  }, [tab]);

  /** 
   * Saves a new driver profile to Supabase.
   */
  const handleSaveDriver = async () => {
    if (!dEmail.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el correo electrónico del conductor.');
      return;
    }
    if (!emailValid(dEmail)) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }
    if (drivers.some(d => d.email.toLowerCase() === dEmail.toLowerCase())) {
      Alert.alert('Correo duplicado', 'Ya existe un conductor registrado con ese correo.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('driver_profiles')
      .insert([{ email: dEmail.trim().toLowerCase() }]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setDEmail('');
      setShowForm(false);
      fetchDrivers();
      Alert.alert('✓ Conductor registrado', `El conductor con correo ${dEmail} ha sido registrado. Podrá iniciar sesión con Google.`);
    }
    setSaving(false);
  };

  const filteredUnits = UNITS.filter(u =>
    u.code.toLowerCase().includes(search.toLowerCase()) ||
    u.num.includes(search)
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSup}>PANEL DE CONTROL LOGÍSTICO</Text>
            <Text style={styles.pageTitle}>Inventario y Logística</Text>
          </View>
        </View>

        <TabBar active={tab} onChange={setTab} />

        {/* ════════════════════ TAB: UNIDADES ════════════════════ */}
        {tab === 'Unidades' && (
          <>
            {/* Search */}
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por placa o ID de unidad"
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Unit cards */}
            <View style={styles.unitList}>
              {filteredUnits.map((u) => (
                <View key={u.num} style={[styles.unitCard, { borderLeftColor: STATUS_COLOR[u.status] }]}>
                  <View style={styles.unitLeft}>
                    <Text style={[styles.unitNum, { color: STATUS_COLOR[u.status] }]}>{u.num}</Text>
                  </View>
                  <View style={styles.unitInfo}>
                    <View style={styles.unitTopRow}>
                      <Text style={styles.unitCode}>{u.code}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[u.status] + '18' }]}>
                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[u.status] }]} />
                        <Text style={[styles.statusText, { color: STATUS_COLOR[u.status] }]}>{u.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.unitMeta}>
                      <Ionicons name="bus-outline" size={11} color={Colors.textMuted} /> {u.model}
                    </Text>
                    <Text style={styles.unitMeta}>
                      <Ionicons name="people-outline" size={11} color={Colors.textMuted} /> {u.cap} pasajeros
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.moreBtn}>
                    <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Add unit CTA */}
            <TouchableOpacity style={styles.addCard}>
              <View>
                <Text style={styles.addCardLabel}>ACCIÓN GLOBAL</Text>
                <Text style={styles.addCardText}>Añadir Nueva Unidad</Text>
              </View>
              <View style={styles.addCardIcon}>
                <Ionicons name="add" size={22} color={Colors.white} />
              </View>
            </TouchableOpacity>

            {/* Fleet status */}
            <View style={styles.fleetCard}>
              <Text style={styles.fleetTitle}>ESTADO DE LA FLOTA</Text>
              {FLEET_STATS.map((f) => (
                <View key={f.label} style={styles.fleetRow}>
                  <View style={[styles.fleetDot, { backgroundColor: f.color }]} />
                  <Text style={styles.fleetItem}>{f.label}</Text>
                  <Text style={[styles.fleetVal, { color: f.color }]}>{f.val}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ════════════════════ TAB: RUTAS ════════════════════ */}
        {tab === 'Rutas' && (
          <View style={styles.routeSection}>
            <View style={styles.routesHeader}>
              <Text style={styles.routesTitle}>Rutas Interprovinciales</Text>
              <TouchableOpacity>
                <Text style={styles.routesAction}>+ Nueva Ruta</Text>
              </TouchableOpacity>
            </View>
            {ROUTES.map((r) => (
              <View key={r.code} style={styles.routeCard}>
                <View style={styles.routeCardHeader}>
                  <View style={styles.routeCodeBadge}>
                    <Text style={styles.routeCodeText}>{r.code}</Text>
                  </View>
                  <Text style={styles.routeCardName}>{r.name}</Text>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.stopsList}>
                  {r.stops.map((s, j) => (
                    <View key={j} style={styles.stopItem}>
                      <View style={[
                        styles.stopDot,
                        { backgroundColor: (j === 0 || j === r.stops.length - 1) ? Colors.primary : Colors.border },
                      ]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stopLabel}>{s.label}</Text>
                        <Text style={styles.stopName}>{s.name}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                {r.km && (
                  <View style={styles.routeMeta}>
                    <Ionicons name="speedometer-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.routeMetaText}>{r.km} km</Text>
                    <Text style={styles.routeMetaSep}>·</Text>
                    <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.routeMetaText}>{r.time}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ════════════════════ TAB: CONDUCTORES ════════════════════ */}
        {tab === 'Conductores' && (
          <View style={styles.driversSection}>

            {/* Info banner explaining the email-auth logic */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
              <Text style={styles.infoText}>
                Solo los conductores registrados aquí podrán acceder con rol de conductor al iniciar sesión con Google.
              </Text>
            </View>

            {/* Header row */}
            <View style={styles.driversSectionHeader}>
              <Text style={styles.driversTitle}>{drivers.length} conductores registrados</Text>
              <TouchableOpacity
                style={styles.addDriverBtn}
                onPress={() => setShowForm(!showForm)}
              >
                <Ionicons name={showForm ? 'close' : 'add'} size={18} color={Colors.white} />
                <Text style={styles.addDriverBtnText}>{showForm ? 'Cancelar' : 'Nuevo'}</Text>
              </TouchableOpacity>
            </View>

            {/* ── New driver form ── */}
            {showForm && (
              <View style={styles.driverForm}>
                <Text style={styles.formTitle}>Registrar Conductor</Text>

                {/* REQUERIMIENTO: correo para verificación Google OAuth */}
                <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
                <View style={[
                  styles.emailInputRow,
                  dEmail.length > 0 && !emailValid(dEmail) && styles.inputError,
                ]}>
                  <Ionicons name="mail-outline" size={16} color={Colors.textMuted} style={{ marginLeft: 12 }} />
                  <TextInput
                    style={styles.emailInput}
                    placeholder="correo@dominio.com"
                    placeholderTextColor={Colors.textMuted}
                    value={dEmail}
                    onChangeText={setDEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {emailValid(dEmail) && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} style={{ marginRight: 12 }} />
                  )}
                </View>
                <Text style={styles.fieldHint}>
                  Este correo se usará para verificar el acceso con Google OAuth.
                </Text>

                <TouchableOpacity
                  style={[styles.saveBtn, (saving || !emailValid(dEmail)) && styles.saveBtnDisabled]}
                  onPress={handleSaveDriver}
                  disabled={saving || !emailValid(dEmail)}
                >
                  {saving ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color={Colors.white} />
                      <Text style={styles.saveBtnText}>Guardar Conductor</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── Drivers list ── */}
            {loadingDrivers ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              drivers.map((d) => (
                <View key={d.id} style={styles.driverCard}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={20} color={Colors.white} />
                  </View>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{d.email}</Text>
                    <View style={styles.driverEmailRow}>
                      <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.driverEmail}>Añadido el {d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</Text>
                    </View>
                  </View>
                  <View style={[styles.driverStatus, { backgroundColor: d.status === 'ACTIVO' ? Colors.success + '18' : Colors.danger + '18' }]}>
                    <Text style={[styles.driverStatusText, { color: d.status === 'ACTIVO' ? Colors.success : Colors.danger }]}>
                      {d.status}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.driverMoreBtn}>
                    <Ionicons name="ellipsis-vertical" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            
            {!loadingDrivers && drivers.length === 0 && (
              <Text style={{ textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.lg }}>
                No hay conductores registrados.
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.primary,
    paddingTop: 52, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg,
  },
  headerSup: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: Colors.white },

  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.lg, marginVertical: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.sm, paddingHorizontal: Spacing.md, ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },

  // Unit cards
  unitList: { paddingHorizontal: Spacing.lg },
  unitCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderLeftWidth: 4, ...Shadow.sm,
  },
  unitLeft:    { width: 48, alignItems: 'center' },
  unitNum:     { fontSize: 20, fontWeight: '900' },
  unitInfo:    { flex: 1, marginLeft: Spacing.sm },
  unitTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  unitCode:    { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusDot:   { width: 6, height: 6, borderRadius: 3 },
  statusText:  { fontSize: 10, fontWeight: '700' },
  unitMeta:    { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  moreBtn:     { padding: 6 },

  // Add card
  addCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: Spacing.lg, backgroundColor: Colors.primary,
    borderRadius: Radius.lg, padding: Spacing.md,
  },
  addCardLabel: { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  addCardText:  { fontSize: 17, fontWeight: '700', color: Colors.white },
  addCardIcon:  { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Fleet
  fleetCard: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md,
  },
  fleetTitle: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  fleetRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  fleetDot:   { width: 10, height: 10, borderRadius: 5 },
  fleetItem:  { flex: 1, fontSize: 14, color: Colors.textPrimary },
  fleetVal:   { fontSize: 16, fontWeight: '800' },

  // Routes tab
  routeSection: { padding: Spacing.lg },
  routesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  routesTitle:  { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  routesAction: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  routeCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md },
  routeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  routeCodeBadge: { backgroundColor: Colors.borderLight, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  routeCodeText:  { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  routeCardName:  { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  stopsList: { gap: 8 },
  stopItem:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stopDot:   { width: 10, height: 10, borderRadius: 5, marginTop: 4, borderWidth: 2, borderColor: Colors.border },
  stopLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  stopName:  { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  routeMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  routeMetaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  routeMetaSep:  { color: Colors.textMuted },

  // Conductores tab
  driversSection: { padding: Spacing.lg },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EFF9FC', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.accentLight + '60',
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  driversSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  driversTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  addDriverBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addDriverBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  // Driver form
  driverForm: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.md, marginBottom: Spacing.lg, ...Shadow.md,
    borderWidth: 1, borderColor: Colors.primaryLight + '30',
  },
  formTitle:    { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 6 },
  fieldInput: {
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, fontSize: 14, color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  emailInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 4,
  },
  emailInput:   { flex: 1, padding: Spacing.md, fontSize: 14, color: Colors.textPrimary },
  inputError:   { borderColor: Colors.danger },
  fieldHint:    { fontSize: 11, color: Colors.textMuted, marginBottom: Spacing.md },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 14, marginTop: 4,
    minHeight: 48,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  // Driver list items
  driverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm,
  },
  driverAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  driverInfo:     { flex: 1 },
  driverName:     { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  driverEmailRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  driverEmail:    { fontSize: 12, color: Colors.textMuted },
  driverUnitRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverUnit:     { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  driverStatus:   { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6 },
  driverStatusText: { fontSize: 11, fontWeight: '700' },
  driverMoreBtn:  { padding: 4 },
});
