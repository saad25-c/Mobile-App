import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthStore from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { Colors } from '../../constants/theme';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = { MON: 'Lun', TUE: 'Mar', WED: 'Mer', THU: 'Jeu', FRI: 'Ven', SAT: 'Sam', SUN: 'Dim' };

export default function DashboardScreen() {
  const router = useRouter();
  const { token, user, teacherProfile } = useAuthStore();
  const [groups, setGroups] = useState([]);
  const [todayLessons, setTodayLessons] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('profilePhoto').then((uri) => { if (uri) setPhoto(uri); });
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/teacher/lessons`, {
          // Envoi du token d'authentification pour autoriser l'accès aux données de l'API
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const allLessons = data.data || [];

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

        const today = DAYS[new Date().getDay()];
        setTodayLessons(allLessons.filter((l) => l.day === today));

        const todayIndex = DAY_ORDER.indexOf(today);
        setUpcoming(
          allLessons
            .filter((l) => DAY_ORDER.indexOf(l.day) > todayIndex)
            .sort((a, b) => {
              const diff = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
              return diff !== 0 ? diff : a.startTime.localeCompare(b.startTime);
            })
            .slice(0, 5)
        );
      } catch {
        Alert.alert('Erreur', 'Impossible de charger les données.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);
  const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour ☀️';
  if (hour < 18) return 'Bon après-midi 🌤️';
  return 'Bonsoir 🌙';
};


  const getLessonName = (lesson) =>
    lesson.subject?.name || lesson.group?.level?.name || lesson.group?.name || 'Cours';

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={Colors.teal} /></View>;
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 30 }}>

      <View style={s.header}>
        <View>
          <Text style={s.welcome}>{getGreeting()}</Text>
          <Text style={s.name}>{user?.prenom} {user?.nom}</Text>
          <Text style={s.role}>{teacherProfile?.specialty || 'Professeur'}</Text>
        </View>
        {photo ? (
          <Image source={{ uri: photo }} style={s.avatarImg} />
        ) : (
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.prenom?.[0]}{user?.nom?.[0]}</Text>
          </View>
        )}
      </View>

      <View style={s.statsRow}>
        <StatCard label="Groupes" value={groups.length} color={Colors.teal} icon={<Ionicons name="people" size={22} color={Colors.teal} />} />
        <StatCard label="Aujourd'hui" value={todayLessons.length} color={Colors.success} icon={<Ionicons name="book" size={22} color={Colors.success} />} />
        <StatCard label="À venir" value={upcoming.length} color={Colors.amber} icon={<Ionicons name="time-outline" size={22} color={Colors.amber} />} />
      </View>

      {/* Mes outils */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="grid-outline" size={18} color={Colors.teal} />
          <Text style={s.sectionTitle}> Mes outils</Text>
        </View>
        <View style={s.toolsGrid}>
          <ToolCard icon="book-outline" label="Devoirs" color="#6366f1" onPress={() => router.push('/(tabs)/devoirs')} />
          <ToolCard icon="document-outline" label="Documents" color="#f59e0b" onPress={() => router.push('/(tabs)/documents')} />
          <ToolCard icon="cash-outline" label="Finance" color="#10b981" onPress={() => router.push('/(tabs)/finance')} />
        </View>
      </View>

      {/* Cours du jour */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="calendar" size={18} color={Colors.teal} />
          <Text style={s.sectionTitle}> Cours du jour</Text>
        </View>
        {todayLessons.length === 0 ? (
          <View style={s.emptyCard}><Text style={s.emptyText}>Aucun cours aujourd'hui</Text></View>
        ) : (
          todayLessons.map((lesson) => (
            <View key={lesson.id} style={s.lessonCard}>
              <View style={s.lessonTimeBadge}>
                <Text style={s.lessonTimeText}>{lesson.startTime}</Text>
                <Text style={s.lessonTimeSep}>—</Text>
                <Text style={s.lessonTimeText}>{lesson.endTime}</Text>
              </View>
              <View style={s.lessonInfo}>
                <Text style={s.lessonName}>{getLessonName(lesson)}</Text>
                {lesson.group?.name && <View style={s.lessonSubRow}><Ionicons name="people" size={12} color="#888" /><Text style={s.lessonSub}> {lesson.group.name}</Text></View>}
                {lesson.classroom?.name && <View style={s.lessonSubRow}><Ionicons name="location" size={12} color="#888" /><Text style={s.lessonSub}> {lesson.classroom.name}</Text></View>}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Prochains cours */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="time-outline" size={18} color={Colors.amber} />
          <Text style={s.sectionTitle}> Prochains cours</Text>
        </View>
        {upcoming.length === 0 ? (
          <View style={s.emptyCard}><Text style={s.emptyText}>Aucun cours à venir cette semaine</Text></View>
        ) : (
          upcoming.map((lesson) => (
            <View key={lesson.id} style={[s.lessonCard, { borderLeftColor: Colors.amber }]}>
              <View style={s.lessonTimeBadge}>
                <Text style={[s.lessonTimeText, { color: Colors.amber }]}>{DAY_LABELS[lesson.day]}</Text>
                <Text style={s.lessonTimeSep}>—</Text>
                <Text style={[s.lessonTimeText, { color: Colors.amber }]}>{lesson.startTime}</Text>
              </View>
              <View style={s.lessonInfo}>
                <Text style={s.lessonName}>{getLessonName(lesson)}</Text>
                {lesson.group?.name && <View style={s.lessonSubRow}><Ionicons name="people" size={12} color="#888" /><Text style={s.lessonSub}> {lesson.group.name}</Text></View>}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Mes groupes */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Ionicons name="people" size={18} color={Colors.teal} />
          <Text style={s.sectionTitle}> Mes Groupes</Text>
        </View>
        {groups.length === 0 ? (
          <View style={s.emptyCard}><Text style={s.emptyText}>Aucun groupe trouvé.</Text></View>
        ) : (
          groups.map((group) => (
            <View key={group.id} style={s.groupCard}>
              <View style={s.groupLeft}>
                <Text style={s.groupName}>{group.name}</Text>
                <Text style={s.groupLevel}>{group.levelName}</Text>
              </View>
              <View style={s.groupBadge}>
                <Text style={s.groupBadgeText}>{group.studentsCount} élèves</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <View style={s.statCard}>
      <View style={s.statIcon}>{icon}</View>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ToolCard({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={[s.toolCard, { borderTopColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={[s.toolLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gris },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, paddingTop: 60, backgroundColor: Colors.teal,
  },
  welcome: { fontSize: 13, color: '#e0f7f8', letterSpacing: 0.3 },
  name: { fontSize: 22, fontWeight: '800', color: Colors.blanc, marginTop: 2 },
  role: { fontSize: 13, color: '#e0f7f8', marginTop: 2, fontStyle: 'italic' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.blanc, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.tealDark,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.teal },
  avatarImg: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: Colors.tealDark },
  statsRow: { flexDirection: 'row', padding: 16, gap: 8, backgroundColor: Colors.blanc, marginBottom: 8 },
  statCard: {
    flex: 1, alignItems: 'center',
    paddingTop: 10, paddingBottom: 8, backgroundColor: Colors.gris,
    borderRadius: 16, elevation: 2,
  },
  statIcon: { marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, letterSpacing: 0.3 },
  lessonCard: {
    backgroundColor: Colors.blanc, borderRadius: 16, padding: 14,
    marginBottom: 8, flexDirection: 'row', elevation: 2,
    borderLeftWidth: 4, borderLeftColor: Colors.teal,
  },
  lessonTimeBadge: { alignItems: 'center', marginRight: 14, justifyContent: 'center', minWidth: 50 },
  lessonTimeText: { fontSize: 13, fontWeight: '700', color: Colors.teal },
  lessonTimeSep: { fontSize: 10, color: '#ccc' },
  lessonInfo: { flex: 1 },
  lessonName: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  lessonSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  lessonSub: { fontSize: 12, color: '#888' },
  groupCard: {
    backgroundColor: Colors.blanc, borderRadius: 16, padding: 14,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', elevation: 2,
  },
  groupLeft: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  groupLevel: { fontSize: 12, color: '#888', marginTop: 2 },
  groupBadge: { backgroundColor: '#e6f7f8', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  groupBadgeText: { fontSize: 12, color: Colors.teal, fontWeight: '700' },
  toolsGrid: { flexDirection: 'row', gap: 10 },
  toolCard: {
    flex: 1, backgroundColor: Colors.blanc, borderRadius: 16,
    padding: 16, alignItems: 'center', elevation: 2, borderTopWidth: 3,
  },
  toolLabel: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  emptyCard: { backgroundColor: Colors.blanc, borderRadius: 16, padding: 20, alignItems: 'center', elevation: 2 },
  emptyText: { color: '#aaa', fontSize: 14 },
});
