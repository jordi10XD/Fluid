import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Modal, TextInput, ActivityIndicator, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Radius, Shadow } from '../../theme/colors';
import { useRole } from '../../context/RoleContext';
import { supabase } from '../../lib/supabase';

const MENU_ITEMS = [
  { icon: 'person-outline', title: 'Mis Datos', desc: 'Información personal y operativa' },
  { icon: 'settings-outline', title: 'Configuración de Cuenta', desc: 'Privacidad y credenciales' },
  { icon: 'notifications-outline', title: 'Notificaciones', desc: 'Alertas y mensajes de sistema' },
  { icon: 'headset-outline', title: 'Ayuda', desc: 'Soporte técnico 24/7' },
];

export default function PerfilUsuarioScreen({ navigation }: any) {
  const { role, setRole, setUserName, setSupabaseUserId } = useRole();
  const [profileData, setProfileData] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    nombres: '',
    telefono: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (userData) {
        if (userData.role === 'operator') {
          const { data: driverData } = await supabase.from('driver_profiles').select('*').eq('id', user.id).maybeSingle();
          if (driverData) {
            setProfileData({ ...userData, ...driverData, realName: driverData.nombre });
          } else {
            setProfileData({ ...userData, realName: userData.nombres });
          }
        } else {
          setProfileData({ ...userData, realName: userData.nombres || user.email?.split('@')[0] });
        }
      }

      const { data: photoData } = await supabase
        .from('user_photos')
        .select('photo')
        .eq('user_id', user.id)
        .maybeSingle();

      if (photoData) {
        setProfilePhoto(photoData.photo);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePhoto = async () => {
    const isDriver = profileData?.role === 'operator';

    const uploadBase64 = async (base64: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setSaving(true);
      const { error } = await supabase
        .from('user_photos')
        .upsert({
          user_id: user.id,
          photo: base64,
        });

      if (error) throw error;
      setProfilePhoto(base64);
      Alert.alert('Éxito', 'Foto de perfil actualizada correctamente.');
    };

    const takePhoto = async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar tu foto de perfil.');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
          await uploadBase64(result.assets[0].base64);
        }
      } catch (e: any) {
        Alert.alert('Error', e.message || 'No se pudo tomar la foto.');
      } finally {
        setSaving(false);
      }
    };

    const pickImage = async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar una foto.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
          await uploadBase64(result.assets[0].base64);
        }
      } catch (e: any) {
        Alert.alert('Error', e.message || 'No se pudo seleccionar la foto.');
      } finally {
        setSaving(false);
      }
    };

    if (isDriver) {
      takePhoto();
    } else {
      Alert.alert(
        'Foto de Perfil',
        '¿Cómo deseas actualizar tu foto de perfil?',
        [
          { text: 'Tomar Foto', onPress: takePhoto },
          { text: 'Elegir de la Galería', onPress: pickImage },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setRole('pasajero');
    setUserName('Usuario');
    setSupabaseUserId(null);
    navigation.replace('Login');
  };

  const openMisDatos = () => {
    setEditForm({
      nombres: profileData?.realName || '',
      telefono: profileData?.telefono || '',
    });
    setModalVisible(true);
  };

  const handleSaveMisDatos = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      if (profileData?.role === 'operator') {
        await supabase.from('driver_profiles').update({
          nombre: editForm.nombres,
          telefono: editForm.telefono,
        }).eq('id', user.id);
      }
      
      await supabase.from('users').update({
        nombres: editForm.nombres,
        telefono: editForm.telefono,
      }).eq('id', user.id);
      
      setModalVisible(false);
      await loadProfile();
      Alert.alert('Éxito', 'Tus datos han sido actualizados.');
    } catch (err) {
      Alert.alert('Error', 'No se pudieron actualizar los datos');
    }
    setSaving(false);
  };

  const handleMenuPress = (item: any) => {
    if (item.title === 'Mis Datos') {
      openMisDatos();
    } else {
      Alert.alert("En desarrollo", "Esta sección estará disponible pronto.");
    }
  };

  const displayName = profileData?.realName || 'Cargando...';
  const displayEmail = profileData?.email || '...';
  const displayPhone = profileData?.telefono || '...';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>Logística Fluida</Text>
          <Ionicons name="radio-outline" size={20} color={Colors.white} />
        </View>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarFrame} onPress={handleUpdatePhoto}>
          {profilePhoto ? (
            <Image 
              source={{ uri: `data:image/jpeg;base64,${profilePhoto}` }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={50} color={Colors.primary} />
            </View>
          )}
          <View style={styles.verifiedBadge}>
            <Ionicons name="camera" size={12} color={Colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{displayName}</Text>
        <View style={styles.idRow}>
          <Ionicons name="mail-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.idText}>{displayEmail}</Text>
        </View>
        <View style={styles.idRow}>
          <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.idText}>{displayPhone}</Text>
        </View>
        <View style={styles.secureBadge}>
          <Ionicons name="lock-closed-outline" size={12} color={Colors.primary} />
          <Text style={styles.secureBadgeText}>CONEXIÓN SEGURA</Text>
        </View>
      </View>



      {/* Menu */}
      <View style={styles.menuSection}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity key={i} style={styles.menuItem} onPress={() => handleMenuPress(item)}>
            <View style={styles.menuIconBox}>
              <Ionicons name={item.icon as any} size={22} color={Colors.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
      <Text style={styles.version}>VERSIÓN DEL SISTEMA 4.2.0-ALPHA</Text>
      <View style={{ height: 80 }} />

      {/* Mis Datos Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Mis Datos</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <TextInput 
              style={styles.textInput} 
              value={editForm.nombres} 
              onChangeText={t => setEditForm({...editForm, nombres: t})}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor={Colors.textMuted}
            />
            
            <Text style={styles.inputLabel}>Número de Teléfono</Text>
            <TextInput 
              style={styles.textInput} 
              value={editForm.telefono} 
              onChangeText={t => setEditForm({...editForm, telefono: t})}
              placeholder="Ej: 0987654321"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMisDatos} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoText: { fontSize: 18, fontWeight: '700', color: Colors.white },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarFrame: { position: 'relative', marginBottom: Spacing.md },
  avatarPlaceholder: {
    width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: Colors.primary,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: {
    width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: Colors.primary,
  },
  verifiedBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white,
  },
  userName: { fontSize: 24, fontWeight: '800', color: Colors.primary, textAlign: 'center', marginBottom: 6 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  idText: { fontSize: 14, color: Colors.textSecondary },
  secureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accentLight + '40', borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  secureBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5 },
  menuSection: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.xl,
    overflow: 'hidden', ...Shadow.sm, marginBottom: Spacing.lg,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuIconBox: {
    width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  menuTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  menuDesc: { fontSize: 12, color: Colors.textMuted },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.lg, backgroundColor: '#FEF2F2', borderRadius: Radius.md,
    padding: 16, marginBottom: Spacing.sm,
  },
  logoutText: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.danger },
  logoutBadge: { backgroundColor: Colors.danger + '20', borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  logoutBadgeText: { fontSize: 11, color: Colors.danger, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 11, color: Colors.textMuted, letterSpacing: 1 },
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: Spacing.lg, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight 
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  modalBody: { padding: Spacing.lg },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8 },
  textInput: { 
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, 
    borderRadius: Radius.md, padding: 14, fontSize: 15, color: Colors.textPrimary, marginBottom: Spacing.lg 
  },
  saveBtn: { 
    backgroundColor: Colors.primary, padding: 16, borderRadius: Radius.md, 
    alignItems: 'center', marginTop: Spacing.sm 
  },
  saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
