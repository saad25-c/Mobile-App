import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView, Switch,
} from 'react-native';
import useAuthStore from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';




const DAYS = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 0 },
];

export default function DisponibilitesScreen() {

const token = useAuthStore((s) => s.token);
const teacherProfile = useAuthStore((s) => s.teacherProfile);
const teacherId = teacherProfile?.id || '';

  const [dispos, setDispos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '10:00',
    isRecurring: true,
    isAvailable: true,
  });

 useEffect(() => {
  if (!token || !teacherId) return;
  fetchDispos(token, teacherId);
}, [token, teacherId]);


  const fetchDispos = async (tok, tid) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/teachers/${tid}/dispo`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      setDispos(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les disponibilités.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ dayOfWeek: 1, startTime: '08:00', endTime: '10:00', isRecurring: true, isAvailable: true });
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      isRecurring: item.isRecurring,
      isAvailable: item.isAvailable,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.startTime || !form.endTime) {
      Alert.alert('Erreur', 'Heures obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const url = editItem
        ? `${API_URL}/api/teachers/${teacherId}/dispo/${editItem.id}`
        : `${API_URL}/api/teachers/${teacherId}/dispo`;
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.status === 200 || res.status === 201) {
        setModalVisible(false);
        fetchDispos(token, teacherId);
      } else {
        const data = await res.json();
        Alert.alert('Erreur', data.error || 'Erreur lors de la sauvegarde.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Supprimer', 'Confirmer la suppression ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/teachers/${teacherId}/dispo/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 200) fetchDispos(token, teacherId);
            else Alert.alert('Erreur', 'Impossible de supprimer.');
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        },
      },
    ]);
  };

  const getDayLabel = (val) => DAYS.find((d) => d.value === val)?.label || '';

  return (
      <View style={styles.container}>
      <View style={[styles.header  ]}>
        <Text style={styles.title}>Disponibilités</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={dispos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.empty}>Aucune disponibilité ajoutée.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.badge, { backgroundColor: item.isAvailable ? '#16a34a' : '#dc2626' }]}>
                  <Text style={styles.badgeText}>{item.isAvailable ? 'Disponible' : 'Indisponible'}</Text>
                </View>
                <Text style={styles.cardDay}>{item.dayName || getDayLabel(item.dayOfWeek)}</Text>
                <Text style={styles.cardTime}>{item.startTime} - {item.endTime}</Text>
                <Text style={styles.cardSub}>{item.isRecurring ? 'Récurrent' : 'Ponctuel'}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Ionicons name="pencil" size={20} color={Colors.teal} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>

            </View>
          )}
        />
      )}

     <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
        <Text style={styles.addBtnText}>+ Ajouter</Text>
      </TouchableOpacity>


      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitle}>{editItem ? 'Modifier' : 'Nouvelle disponibilité'}</Text>

          <Text style={styles.label}>Jour</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.dayBtn, form.dayOfWeek === d.value && styles.dayBtnActive]}
                onPress={() => setForm({ ...form, dayOfWeek: d.value })}
              >
                <Text style={[styles.dayBtnText, form.dayOfWeek === d.value && { color: '#fff' }]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Heure début</Text>
          <TextInput
            style={styles.input}
            placeholder="08:00"
            value={form.startTime}
            onChangeText={(v) => setForm({ ...form, startTime: v })}
          />

          <Text style={styles.label}>Heure fin</Text>
          <TextInput
            style={styles.input}
            placeholder="10:00"
            value={form.endTime}
            onChangeText={(v) => setForm({ ...form, endTime: v })}
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Récurrent</Text>
            <Switch
              value={form.isRecurring}
              onValueChange={(v) => setForm({ ...form, isRecurring: v })}
              trackColor={{ true: '#2563EB' }}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>Disponible</Text>
            <Switch
              value={form.isAvailable}
              onValueChange={(v) => setForm({ ...form, isAvailable: v })}
              trackColor={{ true: '#16a34a', false: '#dc2626' }}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editItem ? 'Modifier' : 'Ajouter'}</Text>}
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
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  card: {
  backgroundColor: Colors.blanc, borderRadius: 16, padding: 16,
  marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between',
  alignItems: 'center', elevation: 2, borderLeftWidth: 4, borderLeftColor: Colors.teal,
},

  cardLeft: { flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  badgeText: { color: Colors.blanc, fontSize: 11, fontWeight: '700' },
  cardDay: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  cardTime: { fontSize: 14, color: Colors.teal, fontWeight: '600', marginTop: 2 },
  cardSub: { fontSize: 12, color: '#999', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
  addBtn: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    backgroundColor: Colors.teal, borderRadius: 16, padding: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  addBtnText: { color: Colors.blanc, fontSize: 16, fontWeight: '700' },
  modal: { padding: 24, paddingTop: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.dark, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.teal, marginBottom: 6, letterSpacing: 0.4, textTransform: 'uppercase' },
  input: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 16,
    padding: 13, fontSize: 14, marginBottom: 16, backgroundColor: Colors.gris, color: Colors.dark,
  },
  dayBtn: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 16,
    padding: 10, marginRight: 8, minWidth: 80, alignItems: 'center', backgroundColor: Colors.blanc,
  },
  dayBtnActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  dayBtnText: { fontSize: 13, fontWeight: '600', color: Colors.dark },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  saveBtn: { backgroundColor: Colors.teal, borderRadius: 16, padding: 15, alignItems: 'center', marginBottom: 12, marginTop: 8 },
  saveBtnText: { color: Colors.blanc, fontSize: 16, fontWeight: '700' },
  cancelBtn: { borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, color: '#888' },
});
