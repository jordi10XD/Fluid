import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../../../theme/colors';

const MOCK_ALERTS = [
  { id: '1', time: '08:15', route: 'Quito — Guayaquil', road: 'TRONCAL PRINCIPAL E35', busId: 'BUS 402', driver: 'Carlos Rivadeneira', type: 'Desvío de Ruta', severity: 'CRÍTICA' },
];

export default function AlertasCriticasScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

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
      <FlatList 
        data={MOCK_ALERTS}
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

            <View style={styles.alertDetails}>
               <Ionicons name="warning" size={16} color={Colors.danger} />
               <Text style={styles.alertText}>{item.type}</Text>
            </View>
          </View>
        )}
      />
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
  card: { backgroundColor: '#FFF1F2', borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm, borderWidth: 1, borderLeftWidth: 4, borderColor: Colors.danger },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  time: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  route: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  road: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  infoText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  separator: { color: Colors.border, marginHorizontal: 4 },
  alertDetails: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(239, 68, 68, 0.2)' },
  alertText: { fontSize: 13, fontWeight: '700', color: Colors.danger },
});