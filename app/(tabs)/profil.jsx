import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../../store/authStore';

export default function ProfilScreen() {
  const router = useRouter();
  const { user, teacherProfile, clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/login');
        },
      },
    ]);
  };

  if (!user) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>;
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.prenom?.[0]}{user?.nom?.[0]}</Text>
        </View>
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
          <Row label="École ID" value={user?.schoolId} small />
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
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, small }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, small && { fontSize: 11 }]}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#2563EB', alignItems: 'center',
    paddingTop: 60, paddingBottom: 30, paddingHorizontal: 24,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff', justifyContent: 'center',
    alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#2563EB' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  role: { fontSize: 14, color: '#bfdbfe', marginTop: 4 },
  roleBadge: {
    marginTop: 8, backgroundColor: '#1d4ed8',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4,
  },
  roleBadgeText: { color: '#bfdbfe', fontSize: 12, fontWeight: '600' },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#666', marginBottom: 8, textTransform: 'uppercase' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#1e1e1e', flex: 1, textAlign: 'right' },
  levelsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelBadge: {
    backgroundColor: '#eff6ff', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  levelBadgeText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  empty: { color: '#999', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  logoutBtn: {
    backgroundColor: '#fee2e2', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: '700' },
});
