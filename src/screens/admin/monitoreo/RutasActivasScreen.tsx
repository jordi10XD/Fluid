import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, Shadow } from '../../../theme/colors';

const MOCK_ROUTES = [
  { id: 'R 1', title: 'Milagro - Riobamba', origin: 'Milagro', paradas: 'Autopista Naranjito Bucay, B1, Naranjito', destination: 'Riobamba', distance: '188.7 km', time: '4h 12min' },
];

export default function RutasActivasScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RUTAS ACTIVAS</Text>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={16} color={Colors.primary} />
        </View>
      </View>

      {/* Buscador + Botón Nuevo */}
      <View style={styles.actionRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput 
            placeholder="Buscar por código o nombre"
            style={styles.searchInput}
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.newBtn}>
          <Text style={styles.newBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Rutas */}
      <FlatList 
        data={MOCK_ROUTES}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.routeCode}>{item.id}</Text>
                <Text style={styles.routeTitle}>{item.title}</Text>
              </View>
              <TouchableOpacity style={styles.moreBtn}>
                <Ionicons name="ellipsis-vertical" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeline}>
              {/* Origin */}
              <View style={styles.timelineItem}>
                <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.label}>ORIGEN</Text>
                  <Text style={styles.value}>{item.origin}</Text>
                </View>
              </View>
              
              {/* Parada */}
              <View style={styles.timelineItem}>
                <View style={[styles.dot, { backgroundColor: 'transparent', borderColor: Colors.border, borderWidth: 2 }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.label}>PARADA INTERMEDIA</Text>
                  <Text style={styles.value}>{item.paradas}</Text>
                </View>
              </View>

              {/* Destination */}
              <View style={styles.timelineItem}>
                <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.label}>DESTINO</Text>
                  <Text style={styles.value}>{item.destination}</Text>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerItem}>
                <Ionicons name="map-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.footerText}>{item.distance}</Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.footerText}>{item.time}</Text>
              </View>
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
  
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, paddingHorizontal: 15, paddingVertical: 12, 
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  newBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.lg },
  newBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  routeCode: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: 2 },
  routeTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  moreBtn: { padding: 4 },

  timeline: { paddingLeft: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 16, position: 'relative' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, zIndex: 2 },
  timelineContent: { marginLeft: 16, flex: 1 },
  label: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },

  footer: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12, marginTop: 4 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
});