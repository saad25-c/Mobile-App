import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../../store/authStore';
import { Colors } from '../../constants/theme';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, teacherProfile, clearAuth } = useAuthStore();
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('profilePhoto').then((uri) => { if (uri) setPhoto(uri); });
  }, []);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorisez l'accès à la galerie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setPhoto(uri);
      await AsyncStorage.setItem('profilePhoto', uri);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter', style: 'destructive',
        onPress: async () => { await clearAuth(); router.replace('/login'); },
      },
    ]);
  };

  if (!user) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.teal} /></View>;
  }

  const levels = [
    teacherProfile?.isPrimaire && 'Primaire',
    teacherProfile?.isCollege && 'Collège',
    teacherProfile?.isLycee && 'Lycée',
    teacherProfile?.isSoutien && 'Soutien',
    teacherProfile?.isLangues && 'Langues',
  ].filter(Boolean);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrap}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.prenom?.[0]}{user?.nom?.[0]}</Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
        <Text style={styles.role}>{teacherProfile?.specialty || 'Professeur'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{user?.role || 'TEACHER'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <View style={styles.card}>
          <Row label="Email" value={user?.email} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations professionnelles</Text>
        <View style={styles.card}>
          <Row label="Spécialité" value={teacherProfile?.specialty || '-'} />
          <Row label="Salaire fixe" value={teacherProfile?.salaryFixe ? `${teacherProfile.salaryFixe} DH` : '-'} />
          <Row label="Taux horaire" value={teacherProfile?.hourlyRate ? `${teacherProfile.hourlyRate} DH/h` : '-'} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Niveaux enseignés</Text>
        <View style={styles.card}>
          {levels.length > 0 ? (
            <View style={styles.levelsRow}>
              {levels.map((l) => (
                <View key={l} style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{l}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.empty}>Aucun niveau renseigné</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={Colors.error} />
          <Text style={styles.logoutText}> Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gris },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.teal, alignItems: 'center',
    paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24,
  },
  avatarWrap: { marginBottom: 12, position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.blanc, justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.blanc },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: Colors.teal },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.tealDark, borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.blanc,
  },
  name: { fontSize: 22, fontWeight: 'bold', color: Colors.blanc },
  role: { fontSize: 14, color: '#e0f7f8', marginTop: 4 },
  roleBadge: { marginTop: 8, backgroundColor: Colors.tealDark, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  roleBadgeText: { color: '#e0f7f8', fontSize: 12, fontWeight: '600' },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.teal, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  card: { backgroundColor: Colors.blanc, borderRadius: 16, padding: 16, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: 14, color: '#888' },
  rowValue: { fontSize: 14, fontWeight: '600', color: Colors.dark, flex: 1, textAlign: 'right' },
  levelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelBadge: { backgroundColor: '#e6f7f8', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  levelBadgeText: { color: Colors.teal, fontSize: 13, fontWeight: '600' },
  empty: { color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  logoutBtn: { backgroundColor: '#fee2e2', borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  logoutText: { color: Colors.error, fontSize: 16, fontWeight: '700' },
});
