// src/screens/admin/PerfilAdminScreen.tsx
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
  { icon: 'person-outline', title: 'Mis Datos', desc: 'Información personal', action: 'mis_datos' },
  { icon: 'settings-outline', title: 'Configuración', desc: 'Ajustes del panel', action: 'config' },
  { icon: 'notifications-outline', title: 'Notificaciones', desc: 'Preferencias de alertas', action: 'notif' },
  { icon: 'shield-checkmark-outline', title: 'Seguridad', desc: 'Gestión de accesos y contraseña', action: 'seguridad' },
];

export default function PerfilAdminScreen({ navigation }: any) {
  const { setRole, setUserName, setSupabaseUserId } = useRole();
  const [profileData, setProfileData] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [editForm, setEditForm] = useState({ nombres: '', telefono: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
        setProfileData({
          ...userData,
          realName: userData.nombres || user.email?.split('@')[0]
        });
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
      console.error('Error cargando perfil:', err);
    }
  };

  const handleUpdatePhoto = async () => {
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

    Alert.alert(
      'Foto de Perfil',
      '¿Cómo deseas actualizar tu foto de perfil?',
      [
        { text: 'Tomar Foto', onPress: takePhoto },
        { text: 'Elegir de la Galería', onPress: pickImage },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
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

      await supabase.from('users').update({
        nombres: editForm.nombres,
        telefono: editForm.telefono,
      }).eq('id', user.id);

      setModalVisible(false);
      await loadProfile();
      Alert.alert('Éxito', 'Datos actualizados correctamente');
    } catch (err) {
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!newPassword) {
      Alert.alert('Error', 'Por favor, introduce la nueva contraseña.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setSecurityModalVisible(false);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleMenuPress = (action: string) => {
    if (action === 'mis_datos') {
      openMisDatos();
    } else if (action === 'seguridad') {
      setNewPassword('');
      setConfirmPassword('');
      setSecurityModalVisible(true);
    } else {
      Alert.alert('Configuración', 'Esta preferencia es administrada automáticamente por la plataforma.');
    }
  };

  const displayName = profileData?.realName || 'Administrador';
  const displayEmail = profileData?.email || '';
  const displayPhone = profileData?.telefono || '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header Admin */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Perfil del Administrador</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Perfil */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleUpdatePhoto}>
            {profilePhoto ? (
              <Image 
                source={{ uri: `data:image/jpeg;base64,${profilePhoto}` }} 
                style={styles.avatarImage} 
              />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={65} color="#0F172A" />
              </View>
            )}
            <View style={styles.badge}>
              <Ionicons name="camera-reverse" size={24} color="#22c55e" />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.role}>Administrador del Sistema</Text>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={18} color="#64748b" />
              <Text style={styles.infoText}>{displayEmail}</Text>
            </View>

            {!!displayPhone && (
              <View style={styles.infoRow}>
                <Ionicons name="call" size={18} color="#64748b" />
                <Text style={styles.infoText}>{displayPhone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Menú */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={() => handleMenuPress(item.action)}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={24} color="#0F172A" />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Mis Datos</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <TextInput 
              style={styles.textInput} 
              value={editForm.nombres} 
              onChangeText={t => setEditForm({...editForm, nombres: t})}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor="#94a3b8"
            />
            
            <Text style={styles.inputLabel}>Número de Teléfono</Text>
            <TextInput 
              style={styles.textInput} 
              value={editForm.telefono} 
              onChangeText={t => setEditForm({...editForm, telefono: t})}
              placeholder="Ej: 0987654321"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMisDatos} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Security Modal */}
      <Modal visible={securityModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSecurityModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seguridad y Acceso</Text>
            <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Nueva Contraseña</Text>
            <TextInput 
              style={styles.textInput} 
              value={newPassword} 
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />
            
            <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
            <TextInput 
              style={styles.textInput} 
              value={confirmPassword} 
              onChangeText={setConfirmPassword}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#94a3b8"
              secureTextEntry
            />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePassword} disabled={savingPassword}>
              {savingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Actualizar Contraseña</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },

  scroll: { flex: 1 },
  profileSection: { alignItems: 'center', paddingVertical: 32 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 5,
    borderColor: '#0F172A',
  },
  avatarImage: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 5,
    borderColor: '#0F172A',
  },
  badge: { position: 'absolute', bottom: 6, right: 6 },

  name: { fontSize: 26, fontWeight: '800', color: '#0F172A' },
  role: { fontSize: 15, color: '#64748b', marginBottom: 20 },
  infoContainer: { marginTop: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  infoText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  menuSection: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  menuDesc: { fontSize: 13, color: '#64748b' },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#fef2f2',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
  },
  logoutText: { color: '#ef4444', fontSize: 17, fontWeight: '700' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' 
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalBody: { padding: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  textInput: { 
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', 
    borderRadius: 12, padding: 14, fontSize: 15, color: '#0F172A', marginBottom: 20 
  },
  saveBtn: { 
    backgroundColor: '#0F172A', padding: 16, borderRadius: 12, 
    alignItems: 'center', marginTop: 10 
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
