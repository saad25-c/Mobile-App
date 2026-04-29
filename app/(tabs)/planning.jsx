import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Dimensions, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { Colors, sectionColor } from '../../constants/theme';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = { MON: 'LUN', TUE: 'MAR', WED: 'MER', THU: 'JEU', FRI: 'VEN', SAT: 'SAM', SUN: 'DIM' };
const SLOTS_SCOLAIRE = ['08:30', '10:30', '14:30', '16:30'];
const SLOTS_JOUR = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
const SLOTS_SOIR = ['17:00', '18:00', '19:00', '20:00'];
const TIME_COL_WIDTH = 36;

export default function PlanningScreen() {
  const token = useAuthStore((s) => s.token);

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSoir, setIsSoir] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const isScolaire = lessons.length === 0 || lessons.some((l) => l.group?.level?.section === 'SCOLAIRE');
  const slots = isScolaire ? SLOTS_SCOLAIRE : isSoir ? SLOTS_SOIR : SLOTS_JOUR;
  const dayColWidth = Math.floor((screenWidth - TIME_COL_WIDTH) / DAYS.length);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenWidth(window.width));
    return () => sub?.remove();
  }, []);

  useEffect(() => {
  if (!token) { setLoading(false); return; }
  fetch(`${API_URL}/api/teacher/lessons`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (r) => {
      const data = await r.json();
      console.log('status:', r.status, 'response:', JSON.stringify(data));
      setLessons(data.data || []);
    })
    .catch((e) => console.log('fetch error:', e.message))
    .finally(() => setLoading(false));
}, [token]);


  const getLesson = (day, slot) =>
    lessons.find((l) => l.day === day && (l.startTime === slot || l.startTime?.startsWith(slot)));

  const getLessonName = (lesson) =>
    lesson.subject?.name || lesson.group?.level?.name || lesson.group?.name || 'G';

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={Colors.teal} /></View>;
  }

  return (
    <View style={[s.container, { backgroundColor: Colors.gris }]}>
      <View style={[s.header, { backgroundColor: Colors.blanc, borderBottomColor: '#eee' }]}>
        <Text style={[s.title, { color: Colors.dark }]}>Mon Planning</Text>
        {!isScolaire && (
          <View style={s.toggle}>
            <TouchableOpacity style={[s.toggleBtn, !isSoir && s.toggleBtnActive]} onPress={() => setIsSoir(false)}>
              <Text style={[s.toggleText, !isSoir && s.toggleTextActive]}>Jour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.toggleBtn, isSoir && s.toggleBtnActive]} onPress={() => setIsSoir(true)}>
              <Text style={[s.toggleText, isSoir && s.toggleTextActive]}>Soir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[s.row, { width: screenWidth }]}>
          <View style={[s.timeCol, { width: TIME_COL_WIDTH, backgroundColor: Colors.blanc }]} />
          {DAYS.map((day) => (
            <View key={day} style={[s.dayCol, { width: dayColWidth, backgroundColor: Colors.blanc }]}>
              <Text style={s.dayLabel}>{DAY_LABELS[day]}</Text>
            </View>
          ))}
        </View>

        {slots.map((slot) => (
          <View key={slot} style={[s.row, { width: screenWidth }]}>
            <View style={[s.timeCol, { width: TIME_COL_WIDTH, backgroundColor: Colors.blanc }]}>
              <Text style={s.timeText}>{slot}</Text>
            </View>
            {DAYS.map((day) => {
              const lesson = getLesson(day, slot);
              return (
                <View key={day} style={[s.cell, { width: dayColWidth, backgroundColor: '#fafafa' }]}>
                  {lesson ? (
                    <TouchableOpacity
                      style={[s.lessonCard, { borderLeftColor: sectionColor(lesson.group?.level?.section), backgroundColor: Colors.blanc }]}
                      onPress={() => setSelectedLesson(lesson)}
                      activeOpacity={0.7}
                    >
               <Text style={s.lessonName} numberOfLines={1}>{lesson.group?.name ? `Groupe ${lesson.group.name.replace(/[^0-9]/g, '')}` : 'Cours'}</Text>
                    </TouchableOpacity>

                  ) : (
                    <View style={s.emptyCell} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!selectedLesson} transparent animationType="fade" onRequestClose={() => setSelectedLesson(null)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSelectedLesson(null)}>
          <View style={[s.modalCard, { backgroundColor: Colors.blanc }]} onStartShouldSetResponder={() => true}>
            <View style={[s.modalAccent, { backgroundColor: sectionColor(selectedLesson?.group?.level?.section) }]} />
            <Text style={[s.modalTitle, { color: Colors.dark }]}>{selectedLesson ? getLessonName(selectedLesson) : ''}</Text>
            <View style={s.modalRow}>
              <Ionicons name="calendar-outline" size={20} color="#6366f1" style={s.modalIcon} />
              <Text style={[s.modalText, { color: '#444' }]}>{selectedLesson ? DAY_LABELS[selectedLesson.day] : ''} · {selectedLesson?.startTime} - {selectedLesson?.endTime}</Text>
            </View>
            {selectedLesson?.group?.name && (
              <View style={s.modalRow}>
                <Ionicons name="people-outline" size={20} color="#f59e0b" style={s.modalIcon} />
                <Text style={s.modalText}>{selectedLesson.group.name}</Text>
              </View>
            )}
            {selectedLesson?.group?.level?.name && (
              <View style={s.modalRow}>
                <Ionicons name="school-outline" size={20} color="#10b981" style={s.modalIcon} />
                <Text style={s.modalText}>{selectedLesson.group.level.name}</Text>
              </View>
            )}
            {selectedLesson?.classroom?.name && (
              <View style={s.modalRow}>
                <Ionicons name="location-outline" size={20} color="#ef4444" style={s.modalIcon} />
                <Text style={s.modalText}>{selectedLesson.classroom.name}</Text>
              </View>
            )}
            <TouchableOpacity style={s.modalClose} onPress={() => setSelectedLesson(null)}>
              <Text style={s.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.dark, letterSpacing: 0.3 },
  toggle: { flexDirection: 'row', backgroundColor: Colors.gris, borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: Colors.teal },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#888' },
  toggleTextActive: { color: Colors.blanc },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee' },
  timeCol: { justifyContent: 'center', alignItems: 'center', padding: 4, backgroundColor: Colors.blanc },
  timeText: { fontSize: 10, color: Colors.teal, fontWeight: '700' },
  dayCol: { alignItems: 'center', paddingVertical: 10, backgroundColor: Colors.blanc },
  dayLabel: { fontSize: 11, fontWeight: '800', color: Colors.dark },
  cell: { minHeight: 72, padding: 4, backgroundColor: '#fafafa' },
  lessonCard: {
  flex: 1, backgroundColor: Colors.blanc, borderRadius: 6,
  borderLeftWidth: 3, padding:2 , elevation: 1, minHeight: 64, justifyContent:'center',
},

  lessonName: { fontSize: 7, fontWeight: '900', color: Colors.dark, marginBottom: 2, textAlign: 'left' },
  lessonGroup: { fontSize: 9, color: '#888' },
  lessonRoom: { fontSize: 9, color: '#aaa', marginTop: 2 },
  emptyCell: { flex: 1, minHeight: 68 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: Colors.blanc, borderRadius: 16, padding: 24, width: '85%', maxWidth: 400, elevation: 8 },
  modalAccent: { height: 4, borderRadius: 2, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.dark, marginBottom: 16 },
  modalRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalIcon: { marginRight: 12, width: 28 },
  modalText: { fontSize: 15, color: '#444', flex: 1 },
  modalClose: { backgroundColor: Colors.teal, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  modalCloseText: { color: Colors.blanc, fontSize: 15, fontWeight: '700' },
});
