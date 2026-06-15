import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';

interface BusTrip {
  id: string;
  hora_salida: string;
  ruta_nombre: string;
  ruta_codigo: string;
  unidad_numero: string;
  unidad_placa: string;
  conductor_nombre: string;
  estado: string;
}

export default function BusesActivosScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [buses, setBuses] = useState<BusTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveBuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('id, hora_salida, ruta_nombre, ruta_codigo, unidad_numero, unidad_placa, conductor_nombre, estado')
        .eq('estado', 'En Ruta')
        .order('hora_salida', { ascending: true });

      if (error) throw error;
      setBuses(data || []);
    } catch (e) {
      console.log('Error fetching active buses:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveBuses();

    // Subscribe to real-time changes in the trips table to keep the active list fresh
    const channelName = `realtime_buses_activos_${Math.random()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        () => {
          fetchActiveBuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveBuses]);

  const filteredBuses = buses.filter(bus => {
    const query = searchQuery.toLowerCase();
    return (
      (bus.unidad_placa?.toLowerCase() || '').includes(query) ||
      (bus.unidad_numero?.toLowerCase() || '').includes(query) ||
      (bus.ruta_nombre?.toLowerCase() || '').includes(query) ||
      (bus.conductor_nombre?.toLowerCase() || '').includes(query)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BUSES ACTIVOS</Text>
        <View style={styles.avatarCircle}>
          <Ionicons name="bus" size={16} color={Colors.primary} />
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput 
          placeholder="Buscar por placa, número de unidad o ruta"
          style={styles.searchInput}
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de Buses */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList 
          data={filteredBuses}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bus-outline" size={60} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No hay buses activos en ruta</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.time}>{item.hora_salida}</Text>
                <Ionicons name="swap-horizontal" size={16} color={Colors.textMuted} />
                <Text style={styles.route}>{item.ruta_nombre}</Text>
              </View>
              <Text style={styles.road}>{item.ruta_codigo || 'SIN CÓDIGO'}</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="bus-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>UNIDAD {item.unidad_numero} ({item.unidad_placa})</Text>
                <Text style={styles.separator}>|</Text>
                <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{item.conductor_nombre}</Text>
              </View>

              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{item.estado.toUpperCase()}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primary, paddingTop: 40, paddingBottom: 15, paddingHorizontal: 20,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, margin: Spacing.md,
    paddingHorizontal: 15, paddingVertical: 12, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  time: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  route: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  road: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  infoText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  separator: { color: Colors.border, marginHorizontal: 4 },
  statusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: '#C8E6C9' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  statusText: { fontSize: 11, fontWeight: '800', color: Colors.success, letterSpacing: 0.5 },
});