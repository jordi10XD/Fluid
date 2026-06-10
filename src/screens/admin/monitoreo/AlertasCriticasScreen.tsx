import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../../../theme/colors';
import { supabase } from '../../../lib/supabase';

export default function AlertasCriticasScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertas();
    
    const subscription = supabase.channel(`incidencias_changes_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidencias' }, () => {
        fetchAlertas();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchAlertas = async () => {
    try {
      const { data, error } = await supabase
        .from('incidencias')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlertas(data || []);
    } catch (e) {
      console.log('Error fetching alertas:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlertas = alertas.filter(a => 
    a.unidad_placa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ruta_nombre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (sev: string) => {
    if (sev === 'Leve') return Colors.success;
    if (sev === 'Moderado') return Colors.warning;
    if (sev === 'Crítico') return Colors.danger;
    return Colors.textMuted;
  };

  const getSeverityBgColor = (sev: string) => {
    if (sev === 'Leve') return '#F0FDF4'; 
    if (sev === 'Moderado') return '#FFFBEB'; 
    if (sev === 'Crítico') return '#FEF2F2'; 
    return Colors.cardBg;
  };

  const getSeverityBorderColor = (sev: string) => {
    if (sev === 'Leve') return '#DCFCE7'; 
    if (sev === 'Moderado') return '#FEF3C7'; 
    if (sev === 'Crítico') return '#FEE2E2'; 
    return Colors.border;
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ALERTAS CRÍTICAS</Text>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={16} color={Colors.primary} />
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput 
          placeholder="Buscar por placa o ID de unidad"
          style={styles.searchInput}
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de Alertas */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList 
          data={filteredAlertas}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const sevColor = getSeverityColor(item.severidad);
            const bgColor = getSeverityBgColor(item.severidad);
            const borderColor = getSeverityBorderColor(item.severidad);
            const isPassenger = item.tipo === 'Asistencia Pasajero';
            
            return (
              <View style={[styles.card, { borderLeftColor: sevColor, backgroundColor: bgColor, borderColor: borderColor }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Text style={styles.time}>{formatTime(item.created_at)}</Text>
                    <Ionicons name="swap-horizontal" size={14} color={Colors.textMuted} />
                    <Text style={styles.route} numberOfLines={1}>{item.ruta_nombre}</Text>
                  </View>
                  
                  {/* Reporter Badge */}
                  <View style={[
                    styles.reporterBadge,
                    {
                      backgroundColor: isPassenger ? '#EFF6FF' : '#FFF7ED',
                      borderColor: isPassenger ? '#BFDBFE' : '#FFEDD5'
                    }
                  ]}>
                    <Ionicons 
                      name={isPassenger ? 'person-outline' : 'bus-outline'} 
                      size={10} 
                      color={isPassenger ? '#2563EB' : '#EA580C'} 
                    />
                    <Text style={[
                      styles.reporterText, 
                      { color: isPassenger ? '#2563EB' : '#EA580C' }
                    ]}>
                      {isPassenger ? 'PASAJERO' : 'CONDUCTOR'}
                    </Text>
                  </View>
                </View>
                {item.descripcion ? <Text style={styles.road}>{item.descripcion}</Text> : null}
                
                <View style={styles.infoRow}>
                  <Ionicons name="bus-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>{item.unidad_placa}</Text>
                  <Text style={styles.separator}>|</Text>
                  <Ionicons name="alert-circle-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>Estado: {item.estado}</Text>
                </View>

                <View style={[styles.alertDetails, { borderTopColor: sevColor + '30' }]}>
                   <Ionicons name="warning" size={16} color={sevColor} />
                   <Text style={[styles.alertText, { color: sevColor }]}>{item.tipo}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: Colors.textMuted }}>No hay incidencias reportadas.</Text>}
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
  card: { 
    borderRadius: Radius.xl, 
    padding: Spacing.lg, 
    marginBottom: Spacing.md, 
    ...Shadow.sm, 
    borderWidth: 1, 
    borderLeftWidth: 4 
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  time: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  route: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  road: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginBottom: 12, lineHeight: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  infoText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  separator: { color: Colors.border, marginHorizontal: 4 },
  alertDetails: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginTop: 4, 
    paddingTop: 12, 
    borderTopWidth: 1 
  },
  alertText: { fontSize: 13, fontWeight: '700', color: Colors.danger },
  reporterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  reporterText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});