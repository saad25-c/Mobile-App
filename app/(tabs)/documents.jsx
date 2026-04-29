import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import useAuthStore from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Types de documents disponibles
const TYPES = ['COURSE', 'EXERCISE', 'CORRECTION', 'RESOURCE'];
const TYPE_LABELS = { COURSE: 'Cours', EXERCISE: 'Exercice', CORRECTION: 'Correction', RESOURCE: 'Ressource' };
const TYPE_COLORS = { COURSE: '#bec5d4', EXERCISE: '#16a34a', CORRECTION: '#d97706', RESOURCE: '#7c3aed' };

export default function DocumentsScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [teacherId, setTeacherId] = useState('');
  // Liste des documents actifs et archivés
  const [documents, setDocuments] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  // Onglet actif : 'actifs' ou 'archives'
  const [activeTab, setActiveTab] = useState('actifs');
  // Modal création/modification
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  // Document en cours de modification (null = création)
  const [editItem, setEditItem] = useState(null);
  // Formulaire
  const [form, setForm] = useState({
    title: '',
    type: 'COURSE',
    fileName: '',
    filePath: '',
    fileSize: 1,
    mimeType: 'application/pdf',

  });

  // Charger teacherId depuis le store au montage
  useEffect(() => {
    if (user?.id) {
      setTeacherId(user.id);
      fetchDocuments(token, user.id);
      fetchArchived(token, user.id);
    }
  }, [user, token]);

  // Récupérer les documents actifs du professeur
  const fetchDocuments = async (tok, tid) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/teachers/${tid}/documents`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les documents.');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les documents archivés du professeur
  const fetchArchived = async (tok, tid) => {
    try {
      const res = await fetch(`${API_URL}/api/teachers/${tid}/documents/archived`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      setArchived(data.documents || []);
    } catch {}
  };

  // Ouvrir le modal en mode création
  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', type: 'COURSE', fileName: '', filePath: '', fileSize: 1, mimeType: 'application/pdf' });
    setModalVisible(true);
  };

  // Ouvrir le modal en mode modification
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title,
      type: item.type,
      fileName: item.fileName,
      filePath: item.filePath,
      fileSize: item.fileSize,
      mimeType: item.mimeType,
    });
    setModalVisible(true);
  };

  // Créer ou modifier un document
  const handleSave = async () => {
    if (!form.title || !form.filePath) {
      Alert.alert('Erreur', 'Titre et URL du fichier obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const url = editItem
        ? `${API_URL}/api/teachers/${teacherId}/documents/${editItem.id}`
        : `${API_URL}/api/teachers/${teacherId}/documents`;
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, fileSize: form.fileSize < 1 ? 1 : form.fileSize }),
      });
      if (res.status === 200 || res.status === 201) {
        setModalVisible(false);
        fetchDocuments(token, teacherId);
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

  // Archiver (désactiver) un document
  const handleArchive = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/teachers/${teacherId}/documents/${id}/deactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        fetchDocuments(token, teacherId);
        fetchArchived(token, teacherId);
      } else {
        Alert.alert('Erreur', 'Impossible d\'archiver.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d\'archiver.');
    }
  };

  // Réactiver un document archivé
  const handleReactivate = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/teachers/${teacherId}/documents/${id}/reactivate`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        fetchDocuments(token, teacherId);
        fetchArchived(token, teacherId);
      } else {
        Alert.alert('Erreur', 'Impossible de réactiver.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de réactiver.');
    }
  };

  // Supprimer définitivement un document
  const handleDelete = async (id) => {
    Alert.alert('Supprimer', 'Supprimer définitivement ce document ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/teachers/${teacherId}/documents/${id}/permanent`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 200) {
              fetchDocuments(token, teacherId);
              fetchArchived(token, teacherId);
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer.');
            }
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        },
      },
    ]);
  };

  // Carte d'affichage d'un document
  const renderCard = (item, isArchived) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.type] || '#666' }]}>
          <Text style={styles.typeBadgeText}>{TYPE_LABELS[item.type] || item.type}</Text>
        </View>
        {isArchived && (
          <View style={styles.archivedBadge}>
            <Text style={styles.archivedBadgeText}>Archivé</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSub}>{item.fileName}</Text>
      {item.subject?.name && <Text style={styles.cardSub}>Matière: {item.subject.name}</Text>}
      {item.group?.name && <Text style={styles.cardSub}>Groupe: {item.group.name}</Text>}
      <View style={styles.cardActions}>
        {!isArchived && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
              <Text style={styles.actionBtnText}>✏️ Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fef3c7' }]} onPress={() => handleArchive(item.id)}>
              <Text style={[styles.actionBtnText, { color: '#d97706' }]}>📦 Archiver</Text>
            </TouchableOpacity>
          </>
        )}
        {isArchived && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dcfce7' }]} onPress={() => handleReactivate(item.id)}>
            <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>♻️ Réactiver</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleDelete(item.id)}>
          <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>🗑 Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
      </View>

      <View style={styles.tabs}>
        {['actifs', 'archives'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'actifs' ? `Actifs (${documents.length})` : `Archivés (${archived.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activeTab === 'actifs' ? documents : archived}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>Aucun document.</Text>}
          renderItem={({ item }) => renderCard(item, activeTab === 'archives')}
        />
      )}

      {activeTab === 'actifs' && (
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Nouveau document</Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>{editItem ? 'Modifier' : 'Nouveau document'}</Text>

          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Titre du document"
            value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })}
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, form.type === t && { backgroundColor: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] }]}
                onPress={() => setForm({ ...form, type: t })}
              >
                <Text style={[styles.typeBtnText, form.type === t && { color: '#fff' }]}>{TYPE_LABELS[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nom du fichier</Text>
          <TextInput
            style={styles.input}
            placeholder="cours_ch5.pdf"
            value={form.fileName}
            onChangeText={(v) => setForm({ ...form, fileName: v })}
          />

          <Text style={styles.label}>URL du fichier *</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={form.filePath}
            onChangeText={(v) => setForm({ ...form, filePath: v })}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Type MIME</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {['application/pdf', 'image/jpeg', 'image/png', 'text/plain'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.mimeBtn, form.mimeType === m && styles.mimeBtnActive]}
                onPress={() => setForm({ ...form, mimeType: m })}
              >
                <Text style={[styles.mimeBtnText, form.mimeType === m && { color: '#fff' }]}>{m.split('/')[1]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editItem ? 'Modifier' : 'Créer'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gris },
  header: { padding: 20, paddingTop: 60, backgroundColor: Colors.blanc, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.dark, letterSpacing: 0.3 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.blanc, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.teal },
  tabText: { fontSize: 13, color: '#999', fontWeight: '600' },
  tabTextActive: { color: Colors.teal },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  card: { backgroundColor: Colors.blanc, borderRadius: 16, padding: 16, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: Colors.teal },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText: { color: Colors.blanc, fontSize: 11, fontWeight: '700' },
  archivedBadge: { backgroundColor: Colors.gris, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  archivedBadgeText: { color: '#888', fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: { backgroundColor: '#e6f7f8', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.teal },
  addBtn: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: Colors.teal, borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  addBtnText: { color: Colors.blanc, fontSize: 16, fontWeight: '700' },
  modal: { padding: 24, paddingTop: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.dark, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.teal, marginBottom: 6, letterSpacing: 0.4, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 13, fontSize: 14, marginBottom: 16, backgroundColor: Colors.gris, color: Colors.dark },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeBtn: { borderWidth: 1, borderColor: '#eee', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  typeBtnText: { fontSize: 12, fontWeight: '600', color: Colors.dark },
  mimeBtn: { borderWidth: 1, borderColor: '#eee', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  mimeBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  mimeBtnText: { fontSize: 12, fontWeight: '600', color: Colors.dark },
  saveBtn: { backgroundColor: Colors.teal, borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 12, marginTop: 8 },
  saveBtnText: { color: Colors.blanc, fontSize: 16, fontWeight: '700' },
  cancelBtn: { borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, color: '#888' },
});

