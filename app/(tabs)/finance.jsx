import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { Colors } from '../../constants/theme';

export default function FinanceScreen() {
  const { token, teacherProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('mois');
  const [payroll, setPayroll] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchPayroll();
    fetchHistory();
  }, [token]);

 const fetchPayroll = async () => {
  try {
    const res = await fetch(`${API_URL}/api/finance/teachers/my-payroll?month=${currentMonth}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPayroll(data || null);  // objet direct, pas un tableau
  } catch {
    Alert.alert('Erreur', 'Impossible de charger la paie.');
  } finally {
    setLoading(false);
  }
};


  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/finance/teachers/my-payroll/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : (data.data || []));
    } catch {}
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={Colors.teal} /></View>;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Finance</Text>
      </View>

      <View style={s.tabs}>
        {['mois', 'historique'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'mois' ? 'Ce mois' : 'Historique'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {activeTab === 'mois' ? (
          payroll ? (
            <>
              {/* Statut paiement */}
              <View style={[s.statusCard, { borderLeftColor: payroll.isPaid ? Colors.success : Colors.warning }]}>
                <View style={[s.statusBadge, { backgroundColor: payroll.isPaid ? Colors.success : Colors.warning }]}>
                  <Text style={s.statusBadgeText}>{payroll.isPaid ? 'Payé' : 'En attente'}</Text>
                </View>
                <Text style={s.statusMonth}>{currentMonth}</Text>
                {payroll.paidAt && <Text style={s.statusDate}>Payé le : {payroll.paidAt?.split('T')[0]}</Text>}
              </View>

              {/* Détails paie */}
              <View style={s.card}>
                <Row icon="time-outline" color="#6366f1" label="Type" value={payroll.paymentType} />
                {(payroll.paymentType === 'HOURLY' || payroll.paymentType === 'MIXED') && (
                  <>
                    <Row icon="calculator-outline" color="#f59e0b" label="Taux horaire" value={`${payroll.hourlyRate} DH/h`} />
                    <Row icon="hourglass-outline" color="#10b981" label="Heures travaillées" value={`${payroll.hoursWorked}h`} />
                  </>
                )}
                <Row icon="cash-outline" color={Colors.teal} label="Montant dû" value={`${payroll.calculatedSalary} DH`} bold />
                {payroll.paidAmount && (
                  <Row icon="checkmark-circle-outline" color={Colors.success} label="Montant payé" value={`${payroll.paidAmount} DH`} bold />
                )}
                {payroll.paymentMethod && (
                  <Row icon="card-outline" color="#7c3aed" label="Méthode" value={payroll.paymentMethod} />
                )}
              </View>
            </>
          ) : (
            <View style={s.emptyCard}>
              <Ionicons name="cash-outline" size={40} color="#ccc" />
              <Text style={s.emptyText}>Aucune donnée de paie ce mois</Text>
            </View>
          )
        ) : (
          history.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="document-outline" size={40} color="#ccc" />
              <Text style={s.emptyText}>Aucun historique disponible</Text>
            </View>
          ) : (
            history.map((item, index) => (
              <View key={index} style={[s.historyCard, { borderLeftColor: item.isPaid ? Colors.success : Colors.warning }]}>
                <View style={s.historyLeft}>
                  <Text style={s.historyMonth}>{item.month || `Mois ${index + 1}`}</Text>
                         {item.hoursWorked != null && (
        <Text style={s.historyHours}>{item.hoursWorked}h · {item.sessionsCount} sessions</Text>
      )}
                </View>
                <View style={s.historyRight}>
                  <Text style={s.historyAmount}>{item.calculatedSalary} DH</Text>
                  <View style={[s.historyBadge, { backgroundColor: item.isPaid ? '#dcfce7' : '#fef3c7' }]}>
                    <Text style={[s.historyBadgeText, { color: item.isPaid ? Colors.success : Colors.warning }]}>
                      {item.isPaid ? 'Payé' : 'En attente'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

function Row({ icon, color, label, value, bold }) {
  return (
    <View style={s.row}>
      <Ionicons name={icon} size={18} color={color} style={{ marginRight: 10 }} />
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, bold && { fontWeight: '800', color: Colors.dark }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gris },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 60, backgroundColor: Colors.blanc, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.dark, letterSpacing: 0.3 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.blanc, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.teal },
  tabText: { fontSize: 13, color: '#999', fontWeight: '600' },
  tabTextActive: { color: Colors.teal },
  statusCard: {
    backgroundColor: Colors.blanc, borderRadius: 16, padding: 16,
    marginBottom: 12, elevation: 2, borderLeftWidth: 4,
  },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 8 },
  statusBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  statusMonth: { fontSize: 16, fontWeight: '700', color: Colors.dark },
  statusDate: { fontSize: 13, color: '#888', marginTop: 4 },
  card: { backgroundColor: Colors.blanc, borderRadius: 16, padding: 16, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { flex: 1, fontSize: 14, color: '#888' },
  rowValue: { fontSize: 14, fontWeight: '600', color: Colors.dark },
  historyCard: {
    backgroundColor: Colors.blanc, borderRadius: 16, padding: 16,
    marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', elevation: 2, borderLeftWidth: 4,
  },
  historyLeft: { flex: 1 },
  historyMonth: { fontSize: 15, fontWeight: '700', color: Colors.dark },
  historyHours: { fontSize: 12, color: '#888', marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 16, fontWeight: '800', color: Colors.dark, marginBottom: 4 },
  historyBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  historyBadgeText: { fontSize: 11, fontWeight: '700' },
  emptyCard: { backgroundColor: Colors.blanc, borderRadius: 16, padding: 40, alignItems: 'center', elevation: 2 },
  emptyText: { color: '#aaa', fontSize: 14, marginTop: 12 },
});