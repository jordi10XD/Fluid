import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../../../theme/colors';

const MOCK_BUSES = [
  { id: '1', time: '08:15', route: 'Quito — Guayaquil', road: 'TRONCAL PRINCIPAL E35', busId: 'BUS 402', driver: 'Carlos Rivadeneira', status: 'OPERATIVO' },
  { id: '2', time: '08:45', route: 'Quito — Riobamba', road: 'TRONCAL PRINCIPAL E35', busId: 'BUS 115', driver: 'Luis Mendoza', status: 'OPERATIVO' },
];

export default function BusesActivosScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BUSES ACTIVOS</Text>
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

      {/* Lista de Buses */}
      <FlatList 
        data={MOCK_BUSES}
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

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{item.status}</Text>
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