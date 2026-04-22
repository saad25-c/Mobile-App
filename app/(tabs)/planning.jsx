import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import useAuthStore from '../../store/authStore';

const API_URL = 'https://teacher-worker.abde-school.workers.dev';

// Jours de la semaine
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = { MON: 'LUN', TUE: 'MAR', WED: 'MER', THU: 'JEU', FRI: 'VEN', SAT: 'SAM', SUN: 'DIM' };
const SLOTS_SCOLAIRE = ['08:30', '10:30', '14:30', '16:30'];
const SLOTS_JOUR = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
const SLOTS_SOIR = ['17:00', '18:00', '19:00', '20:00'];
const sectionColor = (section) => ({ SCOLAIRE: '#2563EB', SOUTIEN: '#16a34a', LANGUE: '#d97706', FORMATION: '#7c3aed' }[section] || '#2563EB');

export default function PlanningScreen() {
  const token = useAuthStore((s) => s.token);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSoir, setIsSoir] = useState(false);

  const isScolaire = lessons.length === 0 || lessons.some((l) => l.group?.level?.section === 'SCOLAIRE');
  const slots = isScolaire ? SLOTS_SCOLAIRE : isSoir ? SLOTS_SOIR : SLOTS_JOUR;

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/teacher/lessons`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setLessons(data.data || []))
      .catch(() => Alert.alert('Erreur', 'Impossible de charger le planning.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Trouver la leçon pour un jour + créneau
  const getLesson = (day, slot) => {
    return lessons.find((l) => {
      if (l.day !== day) return false;
      return l.startTime === slot || l.startTime?.startsWith(slot);
    });
  };

  // Nom affiché de la leçon
  const getLessonName = (lesson) =>
    lesson.subject?.name ||
    lesson.group?.level?.name ||
    lesson.group?.name ||
    'Cours';

  // Nom du prof
  const getTeacherName = (lesson) => {
    const prenom = lesson.teacher?.prenom || lesson.teacher?.user?.prenom || '';
    const nom = lesson.teacher?.nom || lesson.teacher?.user?.nom || '';
    return `${prenom} ${nom}`.trim();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mon Planning</Text>
        {/* Toggle Jour/Soir uniquement pour non-scolaire */}
        {!isScolaire && (
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isSoir && styles.toggleBtnActive]}
              onPress={() => setIsSoir(false)}
            >
              <Text style={[styles.toggleText, !isSoir && styles.toggleTextActive]}>Jour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isSoir && styles.toggleBtnActive]}
              onPress={() => setIsSoir(true)}
            >
              <Text style={[styles.toggleText, isSoir && styles.toggleTextActive]}>Soir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Grille avec scroll horizontal */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 650 }}>

          {/* En-têtes des jours */}
          <View style={styles.row}>
            {/* Colonne horaire vide */}
            <View style={styles.timeCol} />
            {DAYS.map((day) => (
              <View key={day} style={styles.dayCol}>
                <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
              </View>
            ))}
          </View>

          {/* Lignes des créneaux */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {slots.map((slot) => (
              <View key={slot} style={styles.row}>
                {/* Heure */}
                <View style={styles.timeCol}>
                  <Text style={styles.timeText}>{slot}</Text>
                </View>
                {/* Cellules par jour */}
                {DAYS.map((day) => {
                  const lesson = getLesson(day, slot);
                  return (
                    <View key={day} style={styles.cell}>
                      {lesson ? (
                        <View style={[
                          styles.lessonCard,
                          { borderLeftColor: sectionColor(lesson.group?.level?.section) }
                        ]}>
                          <Text style={styles.lessonName} numberOfLines={2}>
                            {getLessonName(lesson)}
                          </Text>
                          {lesson.group?.name && (
                            <Text style={styles.lessonGroup} numberOfLines={1}>
                              👥 {lesson.group.name}
                            </Text>
                          )}
                          {lesson.classroom?.name && (
                            <Text style={styles.lessonRoom} numberOfLines={1}>
                              📍 {lesson.classroom.name}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <View style={styles.emptyCell} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  title: { fontSize: 22, fontWeight: 'bold' },

  // Toggle Jour/Soir
  toggle: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#2563EB' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#666' },
  toggleTextActive: { color: '#fff' },

  // Grille
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  timeCol: { width: 60, justifyContent: 'center', alignItems: 'center', padding: 4, backgroundColor: '#fff' },
  timeText: { fontSize: 11, color: '#999', fontWeight: '600' },
  dayCol: { width: 80, alignItems: 'center', paddingVertical: 10, backgroundColor: '#fff' },
  dayLabel: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
  cell: { width: 80, minHeight: 80, padding: 2, backgroundColor: '#fafafa' },

  // Carte cours
  lessonCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 6,
    borderLeftWidth: 3, padding: 4, elevation: 1,
    minHeight: 76,
  },
  lessonName: { fontSize: 11, fontWeight: '700', color: '#1e1e1e', marginBottom: 2 },
  lessonGroup: { fontSize: 10, color: '#666' },
  lessonRoom: { fontSize: 10, color: '#999', marginTop: 2 },
  emptyCell: { flex: 1, minHeight: 76 },
});
