import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://teacher-worker.abde-school.workers.dev';

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [todayLessons, setTodayLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Charger les infos depuis AsyncStorage
      const u = await AsyncStorage.getItem('user');
      const p = await AsyncStorage.getItem('teacherProfile');
      if (!u || !p) return;
      const parsedUser = JSON.parse(u);
      const parsedProfile = JSON.parse(p);
      setUser(parsedUser);
      setProfile(parsedProfile);

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      try {
        // Charger les cours du professeur
        const lessonsRes = await fetch(`${API_URL}/api/teacher/lessons`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const lessonsData = await lessonsRes.json();
        const allLessons = lessonsData.data || [];

        // Extraire les groupes uniques depuis les leçons
        const seen = new Set();
        const uniqueGroups = [];
        allLessons.forEach((l) => {
          if (l.group && !seen.has(l.group.id)) {
            seen.add(l.group.id);
            uniqueGroups.push({
              id: l.group.id,
              name: l.group.name,
              levelName: l.group.level?.name || '',
              studentsCount: l.group.studentsCount || 0,
            });
          }
        });
        setGroups(uniqueGroups);

        // Filtrer les cours d'aujourd'hui
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const today = days[new Date().getDay()];
        setTodayLessons(allLessons.filter((l) => l.day === today));
      } catch {
        Alert.alert('Erreur', 'Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Nom affiché de la leçon
  const getLessonName = (lesson) =>
    lesson.subject?.name || lesson.group?.level?.name || lesson.group?.name || 'Cours';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>

      {/* Header bonjour */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Bonjour</Text>
          <Text style={styles.name}>{user?.prenom} {user?.nom}</Text>
          <Text style={styles.role}>{profile?.specialty || 'Professeur'}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.prenom?.[0]}{user?.nom?.[0]}</Text>
        </View>
      </View>

      {/* Stats rapides */}
      <View style={styles.statsRow}>
        <StatCard label="Groupes" value={groups.length} color="#2563EB" icon="👥" />
        <StatCard label="Cours aujourd'hui" value={todayLessons.length} color="#16a34a" icon="📚" />
        <StatCard label="Specialite" value={profile?.specialty || '-'} color="#d97706" icon="🎓" small />
      </View>

      {/* Cours du jour */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cours du jour</Text>
        {todayLessons.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucun cours aujourd'hui</Text>
          </View>
        ) : (
          todayLessons.map((lesson) => (
            <View key={lesson.id} style={styles.lessonCard}>
              <View style={styles.lessonTime}>
                <Text style={styles.lessonTimeText}>{lesson.startTime}</Text>
                <Text style={styles.lessonTimeSep}>-</Text>
                <Text style={styles.lessonTimeText}>{lesson.endTime}</Text>
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonName}>{getLessonName(lesson)}</Text>
                {lesson.group?.name && (
                  <Text style={styles.lessonSub}>Groupe: {lesson.group.name}</Text>
                )}
                {lesson.classroom?.name && (
                  <Text style={styles.lessonSub}>Salle: {lesson.classroom.name}</Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Mes groupes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes Groupes</Text>
        {groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucun groupe trouve.</Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupLeft}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupLevel}>{group.levelName}</Text>
              </View>
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText}>{group.studentsCount} eleves</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Infos profil */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mon Profil</Text>
        <View style={styles.profileCard}>
          <Row label="Email" value={user?.email} />
          <Row label="Salaire fixe" value={profile?.salaryFixe ? `${profile.salaryFixe} DH` : '-'} />
          <Row label="Taux horaire" value={profile?.hourlyRate ? `${profile.hourlyRate} DH/h` : '-'} />
          <Row label="Niveaux" value={[
            profile?.isPrimaire && 'Primaire',
            profile?.isCollege && 'College',
            profile?.isLycee && 'Lycee',
            profile?.isSoutien && 'Soutien',
            profile?.isLangues && 'Langues',
          ].filter(Boolean).join(' - ') || '-'} />
        </View>
      </View>

    </ScrollView>
  );
}

// Composant carte statistique
function StatCard({ label, value, color, icon, small }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, small && { fontSize: 13 }, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Composant ligne profil
function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, paddingTop: 60, backgroundColor: '#2563EB',
  },
  welcome: { fontSize: 14, color: '#bfdbfe' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  role: { fontSize: 13, color: '#bfdbfe', marginTop: 2 },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#2563EB' },
  statsRow: {
    flexDirection: 'row', padding: 16, gap: 8,
    backgroundColor: '#fff', marginBottom: 8,
  },
  statCard: {
    flex: 1, alignItems: 'center', borderTopWidth: 3,
    paddingTop: 10, paddingBottom: 8, backgroundColor: '#f9f9f9',
    borderRadius: 10, elevation: 1,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 2, textAlign: 'center' },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e1e1e', marginBottom: 10 },
  lessonCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: 'row', elevation: 1,
  },
  lessonTime: { alignItems: 'center', marginRight: 14, justifyContent: 'center' },
  lessonTimeText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  lessonTimeSep: { fontSize: 10, color: '#999' },
  lessonInfo: { flex: 1 },
  lessonName: { fontSize: 15, fontWeight: '600', color: '#1e1e1e', marginBottom: 4 },
  lessonSub: { fontSize: 12, color: '#666', marginTop: 2 },
  groupCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', elevation: 1,
  },
  groupLeft: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600', color: '#1e1e1e' },
  groupLevel: { fontSize: 12, color: '#666', marginTop: 2 },
  groupBadge: {
    backgroundColor: '#eff6ff', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  groupBadgeText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  profileCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#1e1e1e', flex: 1, textAlign: 'right' },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    alignItems: 'center', elevation: 1,
  },
  emptyText: { color: '#999', fontSize: 14 },
});
