import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';

export default function RetrasosScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [delays, setDelays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDelays = async () => {
    try {
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*');
      if (tripsError) throw tripsError;

      const { data: routes, error: routesError } = await supabase
        .from('routes')
        .select('*');
      if (routesError) throw routesError;

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const delayedTrips = (trips || []).filter(t => {
        if (t.estado === 'Retrasado') return true;
        if (t.estado === 'Completado' || t.estado === 'Cancelado') return false;
        if (t.fecha < todayStr) return true;
        if (t.fecha === todayStr && t.hora_salida < currentHhmm) return true;
        return false;
      }).map(trip => {
        const route = routes?.find(r => r.id === trip.ruta_id);
        
        let delayMinutes = 15;
        const departureDate = new Date(`${trip.fecha}T${trip.hora_salida}:00`);
        const diffMs = Date.now() - departureDate.getTime();
        if (diffMs > 0) {
          delayMinutes = Math.floor(diffMs / 60000);
        }

        const delayTimeStr = delayMinutes > 60
          ? `${Math.floor(delayMinutes / 60)}h ${delayMinutes % 60}m`
          : `${delayMinutes} min`;

        return {
          id: trip.id,
          time: trip.hora_salida,
          route: trip.ruta_nombre || 'Ruta sin nombre',
          road: route ? `${route.origen} — ${route.destino}` : 'Ruta no definida',
          busId: trip.unidad_numero ? `UNIDAD ${trip.unidad_numero}` : `UNIDAD ${trip.unidad_placa || 'S/N'}`,
          driver: trip.conductor_nombre || 'Conductor no asignado',
          delayTime: delayTimeStr,
          status: trip.estado === 'Retrasado' ? 'RETRASADO' : 'FUERA DE TIEMPO',
          unidad_placa: trip.unidad_placa || ''
        };
      });

      setDelays(delayedTrips);
    } catch (e) {
      console.log('Error fetching delays:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelays();
  }, []);

  const filteredDelays = delays.filter(item => 
    item.busId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.unidad_placa.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RETRASOS</Text>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={16} color={Colors.primary} />
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput 
          placeholder="Buscar por placa, unidad o ruta..."
          style={styles.searchInput}
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de Retrasos */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={filteredDelays}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.time}>{item.time}</Text>
                <Ionicons name="swap-horizontal" size={16} color={Colors.textMuted} />
                <Text style={styles.route}>{item.route}</Text>
              </View>
              <Text style={styles.road}>{item.road}</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="bus-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{item.busId}</Text>
                <Text style={styles.separator}>|</Text>
                <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>{item.driver}</Text>
              </View>

              <View style={styles.footerRow}>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <View style={styles.delayBadge}>
                  <Ionicons name="time" size={14} color={Colors.warning} />
                  <Text style={styles.delayText}>+ {item.delayTime}</Text>
                </View>
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
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  time: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  route: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  road: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  infoText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  separator: { color: Colors.border, marginHorizontal: 4 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1, borderColor: '#FEF08A' },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.warning },
  statusText: { fontSize: 10, fontWeight: '800', color: Colors.warning, letterSpacing: 0.5 },
  delayBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  delayText: { fontSize: 13, fontWeight: '800', color: Colors.warning },
});