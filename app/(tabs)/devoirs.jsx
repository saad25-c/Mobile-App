import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import useAuthStore from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { Colors } from '../../constants/theme';

export default function DevoirsScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const teacherProfile = useAuthStore((s) => s.teacherProfile);

  // Liste des devoirs actifs et archivés
  const [devoirs, setDevoirs] = useState([]);
  const [archived, setArchived] = useState([]);

  // Cours du prof pour associer un devoir à un groupe/matière
  const [lessons, setLessons] = useState([]);
  const safeLesson = Array.isArray(lessons) ? lessons : [];

  const [loading, setLoading] = useState(true);

  // Onglet actif : "actifs" ou "archives"
  const [activeTab, setActiveTab] = useState('actifs');

  // Modal de création/modification
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Devoir en cours de modification (null = création)
  const [editItem, setEditItem] = useState(null);

  // Statistiques retournées par l'API (total, à venir, en retard)
  const [stats, setStats] = useState(null);

  // Formulaire de création/modification de devoir
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    subjectId: '',
    groupId: '',
  });

  // Chargement initial
  useEffect(() => {
    if (!user?.id || !token) return;
    fetchDevoirs();
    fetchArchived();
    fetchLessons();
  }, [user, token]);

  // Récupère le planning du prof pour associer un devoir à un cours
  const fetchLessons = async () => {
    try {
      const res = await fetch(`${API_URL}/api/teachers/${tid}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json()
      const list = data.data || data;
      setLessons(Array.isArray(list) ? list : []);
    } catch {}
  };

  // Récupère les devoirs actifs + statistiques
  const fetchDevoirs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/teachers/${user.id}/homeworks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDevoirs(data.homeworks || []);
      setStats(data.statistics || null);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les devoirs.');
    } finally {
      setLoading(false);
    }
  };

  // Récupère les devoirs archivés (désactivés)
  const fetchArchived = async () => {
    try {
      const res = await fetch(`${API_URL}/api/teachers/${user.id}/homeworks/archived`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setArchived(data.homeworks || []);
    } catch {}
  };

  // Ouvre le modal en mode création
  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', description: '', dueDate: new Date().toISOString().split('T')[0], subjectId: '', groupId: '' });
    setModalVisible(true);
  };

  // Ouvre le modal en mode modification avec les données du devoir
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title,
      description: item.description || '',
      dueDate: item.dueDate?.split('T')[0] || '',
      subjectId: item.subjectId || '',
      groupId: item.groupId || '',
    });
    setModalVisible(true);
  };

  // Crée ou modifie un devoir selon editItem
  const handleSave = async () => {
    if (!form.title || !form.dueDate) {
      Alert.alert('Erreur', 'Titre et date limite obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const url = editItem
        ? `${API_URL}/api/teachers/${user.id}/homeworks/${editItem.id}`
        : `${API_URL}/api/teachers/${user.id}/homeworks`;
      const body = {
        title: form.title,
        description: form.description,
        dueDate: new Date(form.dueDate).toISOString(),
        ...(form.subjectId && { subjectId: form.subjectId }),
        ...(form.groupId && { groupId: form.groupId }),
      };
      const res = await fetch(url, {
        method: editItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.status === 200 || res.status === 201) {
        setModalVisible(false);
        fetchDevoirs();
      } else {
        const data = await res.json();
        Alert.alert('Erreur', typeof data.error === 'string' ? data.error : 'Erreur lors de la sauvegarde.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  // Archive un devoir (soft delete → visible dans l'onglet Archivés)
  const handleDeactivate = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/teachers/${user.id}/homeworks/${id}/deactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) { fetchDevoirs(); fetchArchived(); }
      else Alert.alert('Erreur', "Impossible d'archiver.");
    } catch { Alert.alert('Erreur', "Impossible d'archiver."); }
  };

  // Réactive un devoir archivé → le remet dans les actifs
  const handleReactivate = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/teachers/${user.id}/homeworks/${id}/reactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) { fetchDevoirs(); fetchArchived(); }
      else Alert.alert('Erreur', 'Impossible de réactiver.');
    } catch { Alert.alert('Erreur', 'Impossible de réactiver.'); }
  };

  // Suppression définitive après confirmation
  const handleDelete = async (id) => {
    Alert.alert('Supprimer', 'Supprimer définitivement ce devoir ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/teachers/${user.id}/homeworks/${id}/permanent`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 200) { fetchDevoirs(); fetchArchived(); }
            else Alert.alert('Erreur', 'Impossible de supprimer.');
          } catch { Alert.alert('Erreur', 'Impossible de supprimer.'); }
        },
      },
    ]);
  };

  // Vérifie si la date limite est dépassée
  const isOverdue = (dueDate) => new Date(dueDate) < new Date();

  // Carte d'un devoir avec actions contextuelles (modifier, archiver, supprimer)
  const renderCard = (item, isArchived) => (
    <View key={item.id} style={[s.card, isOverdue(item.dueDate) && !isArchived && s.cardOverdue]}>
      <View style={s.cardTop}>
        {item.subject?.name && (
          <View style={s.subjectBadge}>
            <Text style={s.subjectBadgeText}>{item.subject.name}</Text>
          </View>
        )}
        {isArchived && <View style={s.archivedBadge}><Text style={s.archivedBadgeText}>Archivé</Text></View>}
        {/* Badge "En retard" si date dépassée et devoir actif */}
        {isOverdue(item.dueDate) && !isArchived && (
          <View style={[s.archivedBadge, { backgroundColor: '#fee2e2' }]}>
            <Text style={[s.archivedBadgeText, { color: Colors.error }]}>En retard</Text>
          </View>
        )}
      </View>
      <Text style={s.cardTitle}>{item.title}</Text>
      {item.description ? <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
      <View style={s.cardMeta}>
        <Text style={s.cardMetaText}>📅 {item.dueDate?.split('T')[0]}</Text>
        {item.group?.name && <Text style={s.cardMetaText}>👥 {item.group.name}</Text>}
      </View>
      <View style={s.cardActions}>
        {!isArchived && (
          <>
            <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(item)}>
              <Text style={s.actionBtnText}>✏️ Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#fef3c7' }]} onPress={() => handleDeactivate(item.id)}>
              <Text style={[s.actionBtnText, { color: Colors.warning }]}>📦 Archiver</Text>
            </TouchableOpacity>
          </>
        )}
        {isArchived && (
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#dcfce7' }]} onPress={() => handleReactivate(item.id)}>
            <Text style={[s.actionBtnText, { color: Colors.success }]}>♻️ Réactiver</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleDelete(item.id)}>
          <Text style={[s.actionBtnText, { color: Colors.error }]}>🗑 Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Devoirs</Text>
        {/* Statistiques rapides : total, à venir, en retard */}
        {stats && (
          <View style={s.statsRow}>
            <View style={s.statBadge}>
              <Text style={s.statNum}>{stats.totalHomeworks}</Text>
              <Text style={s.statLbl}>Total</Text>
            </View>
            <View style={[s.statBadge, { backgroundColor: '#dcfce7' }]}>
              <Text style={[s.statNum, { color: Colors.success }]}>{stats.upcomingHomeworks}</Text>
              <Text style={s.statLbl}>À venir</Text>
            </View>
            <View style={[s.statBadge, { backgroundColor: '#fee2e2' }]}>
              <Text style={[s.statNum, { color: Colors.error }]}>{stats.overdueHomeworks}</Text>
              <Text style={s.statLbl}>En retard</Text>
            </View>
          </View>
        )}
      </View>

      {/* Onglets : Actifs | Archivés */}
      <View style={s.tabs}>
        {['actifs', 'archives'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'actifs' ? `Actifs (${devoirs.length})` : `Archivés (${archived.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.teal} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activeTab === 'actifs' ? devoirs : archived}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={s.empty}>Aucun devoir.</Text>}
          renderItem={({ item }) => renderCard(item, activeTab === 'archives')}
        />
      )}

      {/* Bouton flottant visible uniquement sur l'onglet actifs */}
      {activeTab === 'actifs' && (
        <TouchableOpacity style={s.addBtn} onPress={openCreate}>
          <Text style={s.addBtnText}>+ Nouveau devoir</Text>
        </TouchableOpacity>
      )}

      {/* Modal création / modification */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={s.modal}>
          <Text style={s.modalTitle}>{editItem ? 'Modifier le devoir' : 'Nouveau devoir'}</Text>

          <Text style={s.label}>Titre *</Text>
          <TextInput style={s.input} placeholder="Titre du devoir" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />

          <Text style={s.label}>Description</Text>
          <TextInput style={[s.input, { height: 80 }]} placeholder="Description optionnelle..." value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />

          <Text style={s.label}>Date limite *</Text>
          <TextInput style={s.input} placeholder="YYYY-MM-DD" value={form.dueDate} onChangeText={(v) => setForm({ ...form, dueDate: v })} />

          {/* Sélection du cours pour associer le devoir à un groupe et une matière */}
          <Text style={s.label}>Cours (Scolaire)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {safeLesson.length === 0 ? (
              <Text style={{ color: '#aaa', fontSize: 13 }}>Aucun cours scolaire trouvé.</Text>
            ) : (
              safeLesson.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={[s.lessonBtn, form.groupId === lesson.groupId && s.lessonBtnActive]}
                  onPress={() => setForm({
                    ...form,
                    groupId: lesson.groupId || '',
                    subjectId: lesson.subjectId || '',
                  })}
                >
                  <Text style={[s.lessonBtnText, form.groupId === lesson.groupId && { color: '#fff' }]}>
                    {lesson.subject?.name || lesson.group?.level?.name || lesson.group?.name || 'Cours'}
                  </Text>
                  <Text style={[s.lessonBtnSub, form.groupId === lesson.groupId && { color: '#e0f7f8' }]}>
                    {lesson.group?.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.blanc} /> : <Text style={s.saveBtnText}>{editItem ? 'Modifier' : 'Créer'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
            <Text style={s.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gris },
  header: { padding: 20, paddingTop: 60, backgroundColor: Colors.blanc, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.dark, letterSpacing: 0.3, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBadge: { backgroundColor: '#e6f7f8', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '800', color: Colors.teal },
  statLbl: { fontSize: 10, color: '#888', marginTop: 1 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.blanc, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.teal },
  tabText: { fontSize: 13, color: '#999', fontWeight: '600' },
  tabTextActive: { color: Colors.teal },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  card: { backgroundColor: Colors.blanc, borderRadius: 16, padding: 16, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: Colors.teal },
  cardOverdue: { borderLeftColor: Colors.error },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  subjectBadge: { backgroundColor: '#e6f7f8', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  subjectBadgeText: { color: Colors.teal, fontSize: 11, fontWeight: '700' },
  archivedBadge: { backgroundColor: Colors.gris, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  archivedBadgeText: { color: '#888', fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#888', marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  cardMetaText: { fontSize: 12, color: '#888' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { backgroundColor: '#e6f7f8', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.teal },
  addBtn: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: Colors.teal, borderRadius: 16, padding: 16, alignItems: 'center' },
  addBtnText: { color: Colors.blanc, fontSize: 16, fontWeight: '700' },
  modal: { padding: 24, paddingTop: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.dark, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.teal, marginBottom: 6, letterSpacing: 0.4, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 13, fontSize: 14, marginBottom: 16, backgroundColor: Colors.gris, color: Colors.dark },
  saveBtn: { backgroundColor: Colors.teal, borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 12, marginTop: 8 },
  saveBtnText: { color: Colors.blanc, fontSize: 16, fontWeight: '700' },
  cancelBtn: { borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, color: '#888' },
  lessonBtn: { borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 10, marginRight: 8, minWidth: 100, alignItems: 'center', backgroundColor: Colors.blanc },
  lessonBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  lessonBtnText: { fontSize: 13, fontWeight: '600', color: Colors.dark },
  lessonBtnSub: { fontSize: 11, color: '#999', marginTop: 2 },
});
