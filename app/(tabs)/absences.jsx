import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from "../../store/authStore";
import { API_URL } from "../../constants/api";
import { Colors } from "../../constants/theme";

const REASONS = ["MALADIE", "PERSONNEL", "URGENCE", "FORMATION"];
// Ajouter après la ligne const REASONS = [...]
const DAY_FR = {
  Monday: "Lundi", Tuesday: "Mardi", Wednesday: "Mercredi",
  Thursday: "Jeudi", Friday: "Vendredi", Saturday: "Samedi", Sunday: "Dimanche",
  MON: "Lundi", TUE: "Mardi", WED: "Mercredi",
  THU: "Jeudi", FRI: "Vendredi", SAT: "Samedi", SUN: "Dimanche",
};

const translateDay = (day) => DAY_FR[day] || day;


const statusColor = (s) => ({ PENDING: Colors.warning, APPROVED: Colors.success, REJECTED: Colors.error })[s] || "#666";
const statusLabel = (s) => ({ PENDING: "En attente", APPROVED: "Approuvee", REJECTED: "Refusee" })[s] || s;

export default function AbsencesScreen() {
  const token = useAuthStore((s) => s.token);
  const teacherProfile = useAuthStore((s) => s.teacherProfile);

  const [activeTab, setActiveTab] = useState("presences");
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState({});
  const [loadingStu dents, setLoadingStudents] = useState(false);
  const [savingAttendances, setSavingAttendances] = useState(false);
  const [absences, setAbsences] = useState([]);
  const [loadingAbsences, setLoadingAbsences] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    lessonId: "",
    reason: "MALADIE",
    comment: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!token || !teacherProfile?.id) return;
    fetchLessons(token);
    fetchAbsences(token);
  }, [token, teacherProfile]);

  const fetchLessons = async (tok) => {
    try {
      const res = await fetch(`${API_URL}/api/teacher/lessons`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.lessons || data.data || []);
      setLessons(Array.isArray(list) ? list : []);
    } catch (e) {
    }
  };

  const fetchAbsences = async (tok) => {
    setLoadingAbsences(true);
    try {
      const res = await fetch(`${API_URL}/api/teacher/absences`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      setAbsences(data.data || []);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les absences.");
    } finally {
      setLoadingAbsences(false);
    }
  };

 const fetchStudents = async (lesson) => {
  setSelectedLesson(lesson);
  setLoadingStudents(true);
  try {
    console.log('lesson object:', JSON.stringify(lesson));
    const groupId = lesson.groupId || lesson.group?.id || lesson.id;
    console.log('groupId used:', groupId);
    console.log('token used:', token);

    const res = await fetch(`${API_URL}/api/groups/${groupId}/students`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log('students response:', JSON.stringify(data));
    const list = Array.isArray(data) ? data : (data.students || []);
    setStudents(list);
    const init = {};
    list.forEach((s) => { init[s.id] = "PRESENT"; });
    setAttendances(init);
  } catch (e) {
    console.log('fetchStudents error:', e.message);
    Alert.alert("Erreur", "Impossible de charger les etudiants.");
  } finally {
    setLoadingStudents(false);
  }
};


  const handleSaveAttendances = async () => {
    setSavingAttendances(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      const res = await fetch(`${API_URL}/api/attendance/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
        lessonId: selectedLesson.id,
          date,
          attendances: Object.entries(attendances).map(([studentId, status]) => ({ studentId, status })),
        }),
      });
      if (res.status === 201) {
        Alert.alert("Succes", "Presences enregistrees.");
        setSelectedLesson(null);
        setStudents([]);
      } else {
        Alert.alert("Erreur", "Erreur lors de l'enregistrement.");
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer.");
    } finally {
      setSavingAttendances(false);
    }
  };

  const handleDeclareAbsence = async () => {
    if (!form.lessonId || !form.date) {
      Alert.alert("Erreur", "Cours et date obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const lesson = lessons.find((l) => l.id === form.lessonId);
      const res = await fetch(`${API_URL}/api/teacher/absence`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lessonId: form.lessonId,
          date: form.date,
          reason: form.reason,
          comment: form.comment,
          startTime: lesson?.startTime,
          endTime: lesson?.endTime,
        }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setModalVisible(false);
        setForm({ lessonId: "", reason: "MALADIE", comment: "", date: new Date().toISOString().split("T")[0] });
        fetchAbsences(token);
      } else {
        Alert.alert("Erreur", typeof data.error === "string" ? data.error : data.message || "Erreur lors de la declaration.");
      }
    } catch {
      Alert.alert("Erreur", "Impossible de declarer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAbsence = async (absenceId) => {
    try {
      const res = await fetch(`${API_URL}/api/teacher/absence/${absenceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        Alert.alert("Succès", "Absence annulée.");
        fetchAbsences(token);
      } else {
        Alert.alert("Erreur", "Impossible d'annuler.");
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'annuler.");
    }
  };

  const renderLessonsList = () => (
    <FlatList
      data={lessons}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      ListEmptyComponent={<Text style={styles.empty}>Aucun cours trouve.</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.lessonCard, pressed && styles.cardHovered]}
          onPress={() => fetchStudents(item)}
        >
          <View style={styles.lessonLeft}>
            <Text style={styles.lessonName}>
              {item.subject?.name || item.group?.name || "Cours"}
            </Text>
       <Text style={styles.lessonSub}>{translateDay(item.day)} - {item.startTime} - {item.endTime}</Text>

            {item.group?.name && <Text style={styles.lessonSub}>Groupe: {item.group.name}</Text>}
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      )}
    />
  );

  const renderStudentsList = () => (
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedLesson(null)}>
        <Text style={styles.backBtnText}>← Retour</Text>
      </TouchableOpacity>
      <Text style={styles.groupTitle}>
        {selectedLesson.subject?.name || selectedLesson.group?.name || "Cours"}
      </Text>
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          Presents: {Object.values(attendances).filter((s) => s === "PRESENT").length}
        </Text>
        <Text style={styles.counterText}>
          Absents: {Object.values(attendances).filter((s) => s === "ABSENT").length}
        </Text>
      </View>
      {loadingStudents ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>Aucun etudiant trouve.</Text>}
          renderItem={({ item, index }) => (
            <View style={styles.studentCard}>
              <Text style={styles.studentIndex}>{index + 1}</Text>
              <Text style={styles.studentName}>{item.prenom} {item.nom}</Text>
              <View style={styles.statusBtns}>
                <TouchableOpacity
                  style={[styles.statusBtn, attendances[item.id] === "PRESENT" && styles.presentBtn]}
                  onPress={() => setAttendances({ ...attendances, [item.id]: "PRESENT" })}
                >
                  <Text style={[styles.statusBtnText, attendances[item.id] === "PRESENT" && { color: "#fff" }]}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.statusBtn, attendances[item.id] === "ABSENT" && styles.absentBtn]}
                  onPress={() => setAttendances({ ...attendances, [item.id]: "ABSENT" })}
                >
                  <Text style={[styles.statusBtnText, attendances[item.id] === "ABSENT" && { color: "#fff" }]}>✗</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
      {students.length > 0 && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAttendances} disabled={savingAttendances}>
          {savingAttendances ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Enregistrer</Text>}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAbsences = () => (
    <View style={{ flex: 1 }}>
      {loadingAbsences ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={absences}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>Aucune absence declaree.</Text>}
          renderItem={({ item }) => (
            <View style={styles.absenceCard}>
              <View style={styles.absenceHeader}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
                  <Text style={styles.statusBadgeText}>{statusLabel(item.status)}</Text>
                </View>
                {item.status === "PENDING" && (
                  <TouchableOpacity onPress={() => handleDeleteAbsence(item.id)}>
                    <Ionicons name="trash" size={20} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
             <Text style={styles.absenceLesson}>
              {item.lesson?.subject?.name || item.lesson?.group?.name || "Cours"}
            </Text>
              {(item.lesson?.day || item.lesson?.dayOfWeek) && (
                <Text style={styles.absenceSub}>
                  Jour: {translateDay(item.lesson?.day || item.lesson?.dayOfWeek)}
                </Text>
              )}
                    <Text style={styles.absenceSub}>Date: {item.date}</Text>

              {item.startTime ? <Text style={styles.absenceSub}>Horaire: {item.startTime} - {item.endTime}</Text> : null}
              <Text style={styles.absenceSub}>Raison: {item.reason}</Text>
              {item.comment ? <Text style={styles.absenceSub}>Commentaire: {item.comment}</Text> : null}
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={() => setModalVisible(true)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.saveBtnText}>+ Declarer une absence</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>Declarer une absence</Text>

          <Text style={styles.label}>Cours *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {(Array.isArray(lessons) ? lessons : []).map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={[styles.lessonBtn, form.lessonId === lesson.id && styles.lessonBtnActive]}
                onPress={() => setForm({ ...form, lessonId: lesson.id })}
              >
                <Text style={[styles.lessonBtnText, form.lessonId === lesson.id && { color: "#fff" }]}>
                  {lesson.subject?.name || lesson.group?.name || "Cours"}
                </Text>
               <Text style={[styles.lessonBtnSub, form.lessonId === lesson.id && { color: "#e0f2fe" }]}>
                {translateDay(lesson.day)} {lesson.startTime}-{lesson.endTime}
              </Text>

              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={form.date}
            onChangeText={(v) => setForm({ ...form, date: v })}
          />

          <Text style={styles.label}>Raison</Text>
          <View style={styles.reasonRow}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonBtn, form.reason === r && styles.reasonBtnActive]}
                onPress={() => setForm({ ...form, reason: r })}
              >
                <Text style={[styles.reasonBtnText, form.reason === r && { color: "#fff" }]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Commentaire</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Optionnel..."
            value={form.comment}
            onChangeText={(v) => setForm({ ...form, comment: v })}
            multiline
          />

          <TouchableOpacity style={styles.declareBtn} onPress={handleDeclareAbsence} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Declarer</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Absences</Text>
      </View>
      <View style={styles.tabs}>
        {["presences", "mesabsences"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { setActiveTab(tab); setSelectedLesson(null); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "presences" ? "Feuilles de presence" : "Mes absences"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeTab === "presences"
        ? selectedLesson ? renderStudentsList() : renderLessonsList()
        : renderAbsences()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gris },
  header: { padding: 20, paddingTop: 60, backgroundColor: Colors.blanc },
  title: { fontSize: 22, fontWeight: '800', color: Colors.dark, letterSpacing: 0.3 },
  tabs: { flexDirection: "row", backgroundColor: Colors.blanc, borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.teal },
  tabText: { fontSize: 13, color: "#999", fontWeight: "600" },
  tabTextActive: { color: Colors.teal },
  lessonCard: {
    backgroundColor: Colors.blanc, borderRadius: 16, padding: 16, marginBottom: 10,
    flexDirection: "row", alignItems: "center", elevation: 2,
  },
  cardHovered: { backgroundColor: "#f0f4ff", elevation: 4, transform: [{ scale: 0.98 }] },
  lessonLeft: { flex: 1 },
  lessonName: { fontSize: 15, fontWeight: "600", color: "#1e1e1e" },
  lessonSub: { fontSize: 12, color: "#666", marginTop: 2 },
  arrow: { fontSize: 22, color: "#2563EB" },
  backBtn: { padding: 16, paddingBottom: 8 },
  backBtnText: { color: "#2563EB", fontWeight: "600", fontSize: 15 },
  groupTitle: { fontSize: 17, fontWeight: "700", paddingHorizontal: 16, marginBottom: 8 },
  counter: { flexDirection: "row", gap: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#fff", marginBottom: 4 },
  counterText: { fontSize: 14, fontWeight: "600", color: "#444" },
  studentCard: {
    backgroundColor: Colors.blanc, borderRadius: 16, padding: 14, marginBottom: 8,
    flexDirection: "row", alignItems: "center", elevation: 2,
  },
  studentIndex: { fontSize: 13, color: "#999", width: 24 },
  studentName: { flex: 1, fontSize: 15, fontWeight: "500" },
  statusBtns: { flexDirection: "row", gap: 8 },
  statusBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#ddd", justifyContent: "center", alignItems: "center" },
  presentBtn: { backgroundColor: Colors.success, borderColor: Colors.success },
  absentBtn: { backgroundColor: Colors.error, borderColor: Colors.error },
  statusBtnText: { fontSize: 16, fontWeight: "700", color: "#444" },
  absenceCard: { backgroundColor: Colors.blanc, borderRadius: 16, padding: 16, marginBottom: 10, elevation: 2 },
  absenceHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  absenceLesson: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  absenceSub: { fontSize: 13, color: "#666", marginTop: 2 },
  saveBtn: { position: "absolute", bottom: 20, left: 16, right: 16, backgroundColor: Colors.teal, borderRadius: 16, padding: 16, alignItems: "center" },
  saveBtnText: { color: Colors.blanc, fontSize: 16, fontWeight: "700" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  modal: { padding: 24, paddingTop: 40 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 24 },
  label: { fontSize: 14, color: "#444", marginBottom: 6, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 16, padding: 12, fontSize: 15, marginBottom: 16, backgroundColor: "#fff" },
  reasonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  reasonBtn: { borderWidth: 1, borderColor: "#ddd", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  reasonBtnActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  reasonBtnText: { fontSize: 12, fontWeight: "600", color: "#444" },
  cancelBtn: { borderWidth: 1, borderColor: "#ddd", borderRadius: 16, padding: 14, alignItems: "center", marginTop: 8 },
  cancelBtnText: { fontSize: 16, color: "#666" },
  lessonBtn: { borderWidth: 1, borderColor: "#ddd", borderRadius: 16, padding: 10, marginRight: 8, minWidth: 100, alignItems: "center" },
  lessonBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  lessonBtnText: { fontSize: 13, fontWeight: "600", color: Colors.dark },
  lessonBtnSub: { fontSize: 11, color: "#999", marginTop: 2 },
  declareBtn: { backgroundColor: Colors.teal, borderRadius: 16, padding: 14, alignItems: "center", marginBottom: 12, marginTop: 8 },
});
