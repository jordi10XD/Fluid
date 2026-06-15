import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, Platform, ActivityIndicator, Modal, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { supabase } from '../../lib/supabase';

interface PeriodOption {
  label: string;
  value: string;
  monthIndex: number;
  year: number;
}

export default function ReportesScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  // Generate last 6 months dynamically
  const getPeriods = (): PeriodOption[] => {
    const options: PeriodOption[] = [];
    const date = new Date();
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    for (let i = 0; i < 6; i++) {
      const m = date.getMonth();
      const y = date.getFullYear();
      options.push({
        label: `${months[m]} ${y}`,
        value: `${y}-${String(m + 1).padStart(2, '0')}`,
        monthIndex: m + 1,
        year: y
      });
      date.setMonth(date.getMonth() - 1);
    }
    return options;
  };

  const periods = getPeriods();
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0].value);

  const [stats, setStats] = useState({
    viajesRealizados: 0,
    viajesCancelados: 0,
    incidenciasTotal: 0,
    conductoresActivos: 0,
    incidenciasLeves: 0,
    incidenciasModeradas: 0,
    incidenciasCriticas: 0,
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [yearStr, monthStr] = selectedPeriod.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);

      const startDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

      // 1. Query completed and canceled trips in the selected month
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('estado')
        .like('fecha', `${selectedPeriod}%`);

      if (tripsError) throw tripsError;

      const realizados = trips?.filter(t => t.estado === 'Completado').length || 0;
      const cancelados = trips?.filter(t => t.estado === 'Cancelado').length || 0;

      // 2. Query incidents in the selected month
      const { data: incidencias, error: incidenciasError } = await supabase
        .from('incidencias')
        .select('severidad')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (incidenciasError) throw incidenciasError;

      const totalIncidencias = incidencias?.length || 0;
      const leves = incidencias?.filter(i => i.severidad === 'Leve').length || 0;
      const moderadas = incidencias?.filter(i => i.severidad === 'Moderado').length || 0;
      const criticas = incidencias?.filter(i => i.severidad === 'Crítico').length || 0;

      // 3. Query active drivers (operator role count)
      const { count: driverCount, error: driversError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'operator');

      if (driversError) throw driversError;

      setStats({
        viajesRealizados: realizados,
        viajesCancelados: cancelados,
        incidenciasTotal: totalIncidencias,
        conductoresActivos: driverCount || 0,
        incidenciasLeves: leves,
        incidenciasModeradas: moderadas,
        incidenciasCriticas: criticas,
      });

    } catch (err: any) {
      console.log('Error loading statistics:', err);
      Alert.alert('Error', 'No se pudieron cargar las estadísticas de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const handleDownloadPDF = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        Alert.alert('Error', 'No se pudo obtener la sesión actual.');
        return;
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://paknizhvsgpoxytxlanz.supabase.co';
      const periodLabel = periods.find(p => p.value === selectedPeriod)?.label || selectedPeriod;

      const functionUrl = `${supabaseUrl}/functions/v1/generate-report-pdf?period=${selectedPeriod}&token=${token}&periodLabel=${encodeURIComponent(periodLabel)}`;
      
      const supported = await Linking.canOpenURL(functionUrl);
      if (supported) {
        await Linking.openURL(functionUrl);
      } else {
        Alert.alert('Error', 'No se puede abrir el enlace del reporte.');
      }
    } catch (error) {
      console.log('Error opening PDF link:', error);
      Alert.alert('Error', 'No se pudo abrir la descarga del reporte.');
    }
  };

  const totalIncidencias = stats.incidenciasTotal || 1;
  const pctLeve = stats.incidenciasTotal > 0 ? (stats.incidenciasLeves / totalIncidencias) * 100 : 0;
  const pctModerada = stats.incidenciasTotal > 0 ? (stats.incidenciasModeradas / totalIncidencias) * 100 : 0;
  const pctCritica = stats.incidenciasTotal > 0 ? (stats.incidenciasCriticas / totalIncidencias) * 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header oscuro */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reportes</Text>
          </View>
          <View style={styles.userIconContainer}>
            <Ionicons name="analytics" size={18} color={Colors.white} />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando estadísticas...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* Selector de Periodo */}
            <View style={styles.periodContainer}>
              <View style={styles.periodLabelRow}>
                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.periodLabel}>Periodo</Text>
              </View>
              <TouchableOpacity 
                style={styles.pickerTrigger} 
                onPress={() => setShowPicker(true)}
              >
                <Text style={styles.pickerTriggerText}>
                  {periods.find(p => p.value === selectedPeriod)?.label || selectedPeriod}
                </Text>
                <Ionicons name="chevron-down" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Resumen general */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resumen general</Text>
              
              <View style={styles.statRow}>
                <View style={styles.statLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="bus" size={18} color="#0284C7" />
                  </View>
                  <Text style={styles.statText}>Viajes realizados</Text>
                </View>
                <Text style={[styles.statValue, { color: '#0284C7' }]}>{stats.viajesRealizados}</Text>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FFEDD5' }]}>
                    <Ionicons name="warning" size={18} color="#EA580C" />
                  </View>
                  <Text style={styles.statText}>Incidencias registradas</Text>
                </View>
                <Text style={[styles.statValue, { color: '#EA580C' }]}>{stats.incidenciasTotal}</Text>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="close-circle" size={18} color="#DC2626" />
                  </View>
                  <Text style={styles.statText}>Viajes cancelados</Text>
                </View>
                <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.viajesCancelados}</Text>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="person" size={18} color="#16A34A" />
                  </View>
                  <Text style={styles.statText}>Conductores activos</Text>
                </View>
                <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.conductoresActivos}</Text>
              </View>
            </View>

            {/* Incidencias principales */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Incidencias principales</Text>
              
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>1. Leve</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${pctLeve}%`, backgroundColor: '#3B82F6' }]} />
                </View>
                <Text style={[styles.progressValue, { color: '#3B82F6' }]}>{stats.incidenciasLeves}</Text>
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>2. Moderado</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${pctModerada}%`, backgroundColor: '#F97316' }]} />
                </View>
                <Text style={[styles.progressValue, { color: '#F97316' }]}>{stats.incidenciasModeradas}</Text>
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>3. Crítico</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${pctCritica}%`, backgroundColor: '#EF4444' }]} />
                </View>
                <Text style={[styles.progressValue, { color: '#EF4444' }]}>{stats.incidenciasCriticas}</Text>
              </View>
            </View>

            {/* Botón Descargar PDF */}
            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.8} onPress={handleDownloadPDF}>
              <Text style={styles.downloadBtnText}>Descargar PDF</Text>
            </TouchableOpacity>

          </ScrollView>
        )}
      </View>

      {/* Modal Custom Picker */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Periodo</Text>
            {periods.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modalItem,
                  selectedPeriod === item.value && styles.modalItemActive
                ]}
                onPress={() => {
                  setSelectedPeriod(item.value);
                  setShowPicker(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedPeriod === item.value && styles.modalItemTextActive
                ]}>
                  {item.label}
                </Text>
                {selectedPeriod === item.value && (
                  <Ionicons name="checkmark" size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Platform.select({
      ios: {
        paddingTop: Spacing.xl,
      },
      android: {
        paddingTop: Spacing.md,
      }
    })
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: Spacing.md,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  userIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  periodContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  periodLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  periodLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  pickerTrigger: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    backgroundColor: '#F8FAFC',
  },
  pickerTriggerText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  progressLabel: {
    width: 90,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    width: 30,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  downloadBtn: {
    backgroundColor: '#0f172a',
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  downloadBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  // Custom Modal Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalItemActive: {
    borderBottomColor: Colors.primary,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalItemTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
