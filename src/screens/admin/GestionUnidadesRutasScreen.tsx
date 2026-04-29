import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

const UNITS = [
  { num: '042', code: 'PBA-4509', model: 'Hino Selekt', cap: 45, status: 'EN RUTA', statusColor: Colors.success, active: '042', base: '' },
  { num: '118', code: 'PCC-8821', model: 'Mercedes-Benz O500', cap: 52, status: 'DISPONIBLE', statusColor: Colors.accent, active: '', base: '118' },
  { num: '007', code: 'PDD-3114', model: 'Volvo B430', cap: 48, status: 'INACTIVO', statusColor: Colors.danger, active: '', base: '' },
];

const ROUTES = [
  {
    code: 'R-001', name: 'TRONCAL SIERRA CENTRAL',
    stops: [{ label: 'ORIGEN', name: 'Quito - Terminal Quitumbe' }, { label: 'PARADA INTERMEDIA', name: 'Latacunga - Terminal Terrestre' }, { label: 'PARADA INTERMEDIA', name: 'Ambato - Ingahurco' }, { label: 'DESTINO', name: 'Riobamba - Terminal Principal' }],
  },
  {
    code: 'R-012', name: 'RUTA DEL SOL EXPRESS',
    stops: [{ label: 'ORIGEN', name: 'Guayaquil - Terminal Pascuales' }, { label: 'PARADA INTERMEDIA', name: 'Santa Elena - Centro' }, { label: 'DESTINO', name: 'Salinas - Malecón' }],
    km: '142.5', time: '2h 15m',
  },
];

export default function GestionUnidadesRutasScreen() {
  const [tab, setTab] = useState('Unidades');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [newDriverEmail, setNewDriverEmail] = useState('');
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    const { data, error } = await supabase.from('driver_profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setDrivers(data);
    }
    setLoadingDrivers(false);
  };

  useEffect(() => {
    if (tab === 'Conductores') {
      fetchDrivers();
    }
  }, [tab]);

  const handleAddDriver = async () => {
    if (!newDriverEmail.trim()) return;
    const { error } = await supabase.from('driver_profiles').insert([{ email: newDriverEmail.trim().toLowerCase() }]);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewDriverEmail('');
      fetchDrivers();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={26} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
          <Text style={styles.headerSup}>PANEL DE CONTROL LOGÍSTICO</Text>
          <Text style={styles.headerSub}>ADMINISTRACIÓN DE ACTIVOS</Text>
          <Text style={styles.pageTitle}>Inventario y Logística</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['Unidades', 'Rutas', 'Conductores'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Unidades' && (
        <>
          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput style={styles.searchInput} placeholder="Buscar por placa o ID de unidad" placeholderTextColor={Colors.textMuted} />
            <Ionicons name="options-outline" size={18} color={Colors.textSecondary} />
          </View>

          {/* Units */}
          <View style={styles.unitList}>
            {UNITS.map((u, i) => (
              <View key={i} style={[styles.unitCard, { borderLeftColor: u.statusColor, borderLeftWidth: 4 }]}>
                <View style={styles.unitLeft}>
                  <Text style={[styles.unitNum, { color: u.statusColor }]}>{u.num}</Text>
                  {u.active && <Text style={styles.unitTag}>ACTIVA</Text>}
                  {u.base && <Text style={[styles.unitTag, { color: Colors.textMuted, borderColor: Colors.border }]}>BASE</Text>}
                </View>
                <View style={styles.unitInfo}>
                  <View style={styles.unitTopRow}>
                    <Text style={styles.unitCode}>{u.code}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: u.statusColor + '20' }]}>
                      <Text style={[styles.statusText, { color: u.statusColor }]}>{u.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.unitModel}>
                    <Ionicons name="bus-outline" size={12} color={Colors.textMuted} /> {u.model}
                  </Text>
                  <Text style={styles.unitCap}>
                    <Ionicons name="people-outline" size={12} color={Colors.textMuted} /> {u.cap} Pax
                  </Text>
                </View>
                <TouchableOpacity style={styles.moreBtn}>
                  <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add unit */}
          <TouchableOpacity style={styles.addUnitCard}>
            <Text style={styles.addUnitLabel}>ACCIÓN GLOBAL</Text>
            <View style={styles.addUnitRow}>
              <Text style={styles.addUnitText}>Añadir Nueva Unidad</Text>
              <View style={styles.addPlusBtn}>
                <Ionicons name="add" size={20} color={Colors.white} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Fleet status */}
          <View style={styles.fleetCard}>
            <Text style={styles.fleetLabel}>ESTADO DE LA FLOTA</Text>
            {[{ label: 'En Operación', val: 24, color: Colors.success }, { label: 'Mantenimiento', val: 8, color: Colors.accent }, { label: 'Crítico / Fuera', val: 2, color: Colors.danger }].map((f, i) => (
              <View key={i} style={styles.fleetRow}>
                <View style={[styles.fleetDot, { backgroundColor: f.color }]} />
                <Text style={styles.fleetItem}>{f.label}</Text>
                <Text style={styles.fleetVal}>{f.val}</Text>
              </View>
            ))}
          </View>

          {/* Heat map */}
          <View style={styles.heatCard}>
            <View style={styles.heatHeader}>
              <Text style={styles.heatLabel}>MAPA DE CALOR LOGÍSTICO</Text>
              <Text style={styles.heatRoute}>Ruta UIO - GYE</Text>
              <TouchableOpacity style={styles.heatBtn}>
                <Ionicons name="locate" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.heatMap}>
              {[...Array(5)].map((_, i) => (
                <View key={i} style={[styles.heatLine, { top: i * 30 }]} />
              ))}
              <View style={styles.heatRouteOverlay} />
            </View>
            <View style={styles.heatMeta}>
              <View>
                <Text style={styles.heatMetaLabel}>CARGA PROMEDIO</Text>
                <Text style={styles.heatMetaVal}>82%</Text>
              </View>
              <View>
                <Text style={styles.heatMetaLabel}>LATENCIA GPS</Text>
                <Text style={styles.heatMetaVal}>12ms</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {tab === 'Rutas' && (
        <View style={styles.routeSection}>
          <View style={styles.routesHeader}>
            <Text style={styles.routesTitle}>Explorador de Rutas Interprovinciales</Text>
            <TouchableOpacity>
              <Text style={styles.routesAction}>+ Gestionar Paradas</Text>
            </TouchableOpacity>
          </View>
          {ROUTES.map((r, i) => (
            <View key={i} style={styles.routeCard}>
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
                    <View style={[styles.stopDot, { backgroundColor: j === 0 || j === r.stops.length - 1 ? Colors.primary : Colors.border }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stopLabel}>{s.label}</Text>
                      <Text style={styles.stopName}>{s.name}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {r.km && (
                <View style={styles.routeMeta}>
                  <Text style={styles.routeMetaText}>{r.km} KM</Text>
                  <Text style={styles.routeMetaSep}>·</Text>
                  <Text style={styles.routeMetaText}>{r.time}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {tab === 'Conductores' && (
        <View style={styles.routeSection}>
          <View style={styles.routesHeader}>
            <Text style={styles.routesTitle}>Perfiles de Conductor</Text>
          </View>
          
          <View style={[styles.searchRow, { marginHorizontal: 0, marginBottom: Spacing.lg }]}>
            <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Correo del nuevo conductor" 
              placeholderTextColor={Colors.textMuted}
              value={newDriverEmail}
              onChangeText={setNewDriverEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity onPress={handleAddDriver}>
              <Ionicons name="add-circle" size={32} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {loadingDrivers ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {drivers.map((d, i) => (
                <View key={d.id} style={styles.unitCard}>
                  <View style={[styles.unitLeft, { width: 40 }]}>
                    <Ionicons name="person-circle" size={36} color={Colors.primary} />
                  </View>
                  <View style={styles.unitInfo}>
                    <Text style={styles.unitCode}>{d.email}</Text>
                    <Text style={styles.unitModel}>Añadido: {new Date(d.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))}
              {drivers.length === 0 && (
                <Text style={{ textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.lg }}>
                  No hay conductores registrados.
                </Text>
              )}
            </View>
          )}
        </View>
      )}

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
  headerSup: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 0.5 },
  headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: Colors.white },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md, backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.sm, paddingHorizontal: Spacing.md, ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  unitList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  unitCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm, gap: Spacing.sm,
  },
  unitLeft: { alignItems: 'center', width: 50 },
  unitNum: { fontSize: 22, fontWeight: '900' },
  unitTag: { fontSize: 9, fontWeight: '700', color: Colors.success, borderWidth: 1, borderColor: Colors.success, borderRadius: 4, paddingHorizontal: 4, marginTop: 2 },
  unitInfo: { flex: 1 },
  unitTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  unitCode: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  unitModel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  unitCap: { fontSize: 12, color: Colors.textMuted },
  moreBtn: { padding: 6 },
  addUnitCard: { margin: Spacing.lg, backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.md },
  addUnitLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  addUnitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addUnitText: { fontSize: 18, fontWeight: '700', color: Colors.white },
  addPlusBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  fleetCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md },
  fleetLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  fleetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  fleetDot: { width: 10, height: 10, borderRadius: 5 },
  fleetItem: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  fleetVal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  heatCard: { marginHorizontal: Spacing.lg, backgroundColor: Colors.primary, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.md },
  heatHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  heatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  heatRoute: { fontSize: 14, fontWeight: '700', color: Colors.white, marginRight: 8 },
  heatBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  heatMap: { height: 100, backgroundColor: Colors.primaryLight, position: 'relative', overflow: 'hidden' },
  heatLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  heatRouteOverlay: { position: 'absolute', width: 3, height: '200%', backgroundColor: Colors.accent, left: '40%', top: -20, transform: [{ rotate: '15deg' }] },
  heatMeta: { flexDirection: 'row', justifyContent: 'space-around', padding: Spacing.md },
  heatMetaLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  heatMetaVal: { fontSize: 20, fontWeight: '900', color: Colors.white },
  routeSection: { padding: Spacing.lg },
  routesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  routesTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  routesAction: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  routeCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md },
  routeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  routeCodeBadge: { backgroundColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  routeCodeText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  routeCardName: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  stopsList: { gap: 8 },
  stopItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stopDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, borderWidth: 2, borderColor: Colors.border },
  stopLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', letterSpacing: 0.5 },
  stopName: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  routeMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  routeMetaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  routeMetaSep: { color: Colors.textMuted },
  fab: { position: 'absolute', bottom: 90, right: Spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.lg },
});
