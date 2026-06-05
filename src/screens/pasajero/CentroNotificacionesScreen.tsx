import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

const TYPE_COLORS: Record<string, string> = {
  danger: Colors.danger,
  warning: Colors.warning,
  success: Colors.success,
  muted: Colors.textMuted,
};

export default function CentroNotificacionesScreen() {
  const [filtro, setFiltro] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertas = async () => {
    try {
      const { data, error } = await supabase
        .from('incidencias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlertas(data || []);
    } catch (e) {
      console.log('Error fetching alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();

    // Subscribe to new incidents in real-time
    const subscription = supabase.channel(`incidencias_passenger_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidencias' }, () => {
        fetchAlertas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const getAlertMetadata = (item: any) => {
    let type = 'muted';
    let icon = 'information-circle-outline';
    if (item.severidad === 'Crítico') {
      type = 'danger';
      icon = 'alert-circle';
    } else if (item.severidad === 'Moderado') {
      type = 'warning';
      icon = 'warning-outline';
    } else if (item.severidad === 'Leve') {
      type = 'success';
      icon = 'checkmark-circle-outline';
    }

    const date = new Date(item.created_at);
    const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return {
      type,
      icon,
      title: `${item.tipo} · Unidad ${item.unidad_placa || 'S/N'}`,
      detail: item.descripcion || 'Sin descripción detallada.',
      meta: `RUTA: ${item.ruta_nombre || 'No especificada'} · ESTADO: ${item.estado || 'PENDIENTE'}`,
      time: timeFormatted.toUpperCase(),
      hasMap: !!(item.lat && item.lng),
    };
  };

  const filteredAlertas = alertas.filter((a) => {
    const matchesSearch = searchQuery
      ? (a.unidad_placa?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         a.tipo?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    if (!matchesSearch) return false;

    if (filtro === 'Todas') return true;
    if (filtro === 'Retrasos') return a.tipo?.toLowerCase().includes('retraso');
    if (filtro === 'Seguridad') return !a.tipo?.toLowerCase().includes('retraso');
    return true;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={26} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CENTRO DE ALERTAS</Text>
        <TouchableOpacity>
          <Ionicons name="person-circle-outline" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Security Banner */}
      <View style={styles.secBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.secLabel}>ESTADO DE SEGURIDAD</Text>
          <Text style={styles.secTitle}>Protocolo RF-G04 Activo</Text>
          <Text style={styles.secDesc}>
            Monitoreo cinético en tiempo real activado para todas las unidades en la red nacional.
          </Text>
        </View>
        <Ionicons name="shield-checkmark-outline" size={60} color="rgba(255,255,255,0.12)" style={styles.shieldIcon} />
      </View>

      {/* Alert count */}
      <View style={styles.alertCountCard}>
        <Text style={styles.alertCountLabel}>ALERTAS REGISTRADAS</Text>
        <Text style={styles.alertCountNum}>
          {alertas.length} <Text style={styles.alertCountSub}>Incidentes reportados</Text>
        </Text>
        <View style={styles.alertProgress}>
          <View style={[styles.alertProgressFill, { width: alertas.length > 0 ? '100%' : '0%' }]} />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {['Todas', 'Retrasos', 'Seguridad'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filtro === f && styles.filterChipActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filterText, filtro === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por placa o tipo..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Notifications */}
      <View style={styles.notifList}>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 32 }} />
        ) : filteredAlertas.length === 0 ? (
          <Text style={styles.emptyText}>No hay incidencias registradas.</Text>
        ) : (
          filteredAlertas.map((item) => {
            const n = getAlertMetadata(item);
            return (
              <View key={item.id} style={[styles.notifCard, { borderLeftColor: TYPE_COLORS[n.type] }]}>
                <View style={styles.notifHeader}>
                  <View style={[styles.notifIconBox, { backgroundColor: TYPE_COLORS[n.type] + '20' }]}>
                    <Ionicons name={n.icon as any} size={20} color={TYPE_COLORS[n.type]} />
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifTime}>{n.time}</Text>
                  </View>
                </View>
                <Text style={styles.notifDetail}>{n.detail}</Text>
                {n.meta !== '' && (
                  <View style={styles.notifMeta}>
                    <Text style={styles.notifMetaText}>{n.meta}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Server Status */}
      <View style={styles.serverStatus}>
        <View style={styles.serverDot} />
        <Text style={styles.serverText}>SERVIDOR ANDINA CENTRAL: OPERATIVO</Text>
        <View style={styles.serverMeta}>
          {[['PRECISIÓN GPS', '99.8%'], ['LATENCIA', '42ms'], ['UPTIME', '365d']].map(([l, v]) => (
            <View key={l} style={{ alignItems: 'center' }}>
              <Text style={styles.serverMetaLabel}>{l}</Text>
              <Text style={styles.serverMetaVal}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingTop: 52, paddingBottom: Spacing.md,
  },
  headerTitle: { color: Colors.white, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  secBanner: {
    backgroundColor: Colors.primary, padding: Spacing.lg, flexDirection: 'row',
    alignItems: 'center', position: 'relative', overflow: 'hidden',
  },
  secLabel: { fontSize: 10, color: Colors.accentLight, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  secTitle: { fontSize: 20, fontWeight: '800', color: Colors.white, marginBottom: 6 },
  secDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },
  shieldIcon: { position: 'absolute', right: 10, top: 10 },
  alertCountCard: { backgroundColor: Colors.primaryLight, margin: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.md },
  alertCountLabel: { fontSize: 10, color: Colors.accentLight, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  alertCountNum: { fontSize: 24, fontWeight: '800', color: Colors.white, marginBottom: 8 },
  alertCountSub: { fontSize: 14, fontWeight: '400' },
  alertProgress: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  alertProgressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
  filtersRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, marginBottom: Spacing.sm },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: Spacing.sm,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  notifList: { paddingHorizontal: Spacing.lg },
  notifCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderLeftWidth: 4, ...Shadow.sm,
  },
  notifHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  notifIconBox: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1, lineHeight: 20 },
  notifTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  notifDetail: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
  notifMeta: { backgroundColor: Colors.background, borderRadius: Radius.sm, padding: 8 },
  notifMetaText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  emptyText: { textAlign: 'center', marginVertical: 32, fontSize: 14, color: Colors.textMuted },
  serverStatus: {
    marginHorizontal: Spacing.lg, borderRadius: Radius.lg, backgroundColor: Colors.white,
    padding: Spacing.md, ...Shadow.sm, marginBottom: Spacing.md,
  },
  serverDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginBottom: 4 },
  serverText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: 10 },
  serverMeta: { flexDirection: 'row', justifyContent: 'space-around' },
  serverMetaLabel: { fontSize: 9, color: Colors.textMuted, letterSpacing: 1, marginBottom: 2 },
  serverMetaVal: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
});
