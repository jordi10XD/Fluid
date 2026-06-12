import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface HistorialNotificacion {
  id: string;
  titulo: string;
  mensaje: string;
  audiencia: string;
  estado: string;
  created_at: string;
}

const AUDIENCE_COLORS: Record<string, { bg: string; icon: string }> = {
  'all': { bg: '#E0F2FE', icon: '#0284C7' }, // Blue
  'passengers': { bg: '#FFEDD5', icon: '#EA580C' }, // Orange
  'drivers': { bg: '#DCFCE7', icon: '#16A34A' }, // Green
};

const AUDIENCE_LABEL: Record<string, string> = {
  'all': 'Todos los destinatarios',
  'passengers': 'Pasajeros',
  'drivers': 'Conductores',
};

// Mock data as fallback
const MOCK_HISTORY: HistorialNotificacion[] = [
  { id: '1', titulo: 'Cierre parcial en Vía E35', mensaje: 'Cierre', audiencia: 'all', estado: 'Enviado', created_at: new Date().toISOString() },
  { id: '2', titulo: 'Cambio de Turno: Sector Sur', mensaje: 'Turno', audiencia: 'drivers', estado: 'Enviado', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', titulo: 'Nueva Ruta: Guayaquil Express', mensaje: 'Ruta', audiencia: 'passengers', estado: 'Enviado', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', titulo: 'Retraso en Ruta Norte', mensaje: 'Retraso', audiencia: 'all', estado: 'Enviado', created_at: new Date(Date.now() - 86400000).toISOString() },
];

export default function HistorialNotificacionesScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [historial, setHistorial] = useState<HistorialNotificacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      // Intentamos obtener del backend real
      const { data, error } = await supabase
        .from('notificaciones_historial')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('No se pudo cargar desde Supabase (quizás la tabla no existe). Usando datos de prueba.');
        setHistorial(MOCK_HISTORY);
      } else {
        setHistorial(data || MOCK_HISTORY);
      }
    } catch (e) {
      setHistorial(MOCK_HISTORY);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoDate: string) => {
    const d = new Date(isoDate);
    const today = new Date();
    const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${isToday ? 'Hoy' : 'Ayer'}, ${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all': return 'megaphone';
      case 'passengers': return 'person';
      case 'drivers': return 'bus';
      default: return 'megaphone';
    }
  };

  const renderItem = ({ item }: { item: HistorialNotificacion }) => {
    const audStyle = AUDIENCE_COLORS[item.audiencia] || AUDIENCE_COLORS['all'];
    const label = AUDIENCE_LABEL[item.audiencia] || 'Todos los destinatarios';

    return (
      <View style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: audStyle.bg }]}>
          <Ionicons name={getAudienceIcon(item.audiencia) as any} size={24} color={audStyle.icon} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.titulo}</Text>
          <Text style={styles.cardSubtitle}>{label}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.estado}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Notificaciones</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar notificación por título..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity style={styles.filterChip}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.filterText}>Fecha: Hoy</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.filterText}>Destinatarios: Todos</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={historial.filter(h => h.titulo.toLowerCase().includes(search.toLowerCase()))}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#0F172A',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9',
    margin: 16, paddingHorizontal: 12, borderRadius: 8, height: 45,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: Colors.textPrimary },
  filtersContainer: {
    flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 10
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  filterText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  cardSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: '#94A3B8' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
