import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = "https://teacher-worker.abde-school.workers.dev";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getMimeIcon = (mimeType) => {
  if (!mimeType) return "📄";
  if (mimeType.includes("pdf")) return "📕";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📘";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "📙";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("text")) return "📝";
  return "📄";
};

const TYPE_LABELS = {
  COURSE: "Cours",
  EXERCISE: "Exercice",
  CORRECTION: "Correction",
  RESOURCE: "Ressource",
};

const TYPE_COLORS = {
  COURSE: { bg: "#EEF2FF", text: "#4F46E5", border: "#C7D2FE" },
  EXERCISE: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  CORRECTION: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
  RESOURCE: { bg: "#FDF4FF", text: "#9333EA", border: "#E9D5FF" },
};

// ─── API ──────────────────────────────────────────────────────────────────────
const api = {
  getDocuments: async (teacherId, token, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(
      `${API_BASE}/api/teachers/${teacherId}/documents${query ? `?${query}` : ""}`,
      { headers: getAuthHeaders(token) },
    );
    if (!res.ok) throw new Error("Erreur lors du chargement");
    return res.json();
  },

  createDocument: async (teacherId, token, body) => {
    const res = await fetch(`${API_BASE}/api/teachers/${teacherId}/documents`, {
      method: "POST",
      headers: getAuthHeaders(token),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Erreur lors de la création");
    return res.json();
  },

  updateDocument: async (teacherId, token, documentId, body) => {
    const res = await fetch(
      `${API_BASE}/api/teachers/${teacherId}/documents/${documentId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(token),
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) throw new Error("Erreur lors de la modification");
    return res.json();
  },

  deactivateDocument: async (teacherId, token, documentId) => {
    const res = await fetch(
      `${API_BASE}/api/teachers/${teacherId}/documents/${documentId}/deactivate`,
      { method: "PUT", headers: getAuthHeaders(token) },
    );
    if (!res.ok) throw new Error("Erreur lors de la désactivation");
    return res.json();
  },

  deleteDocument: async (teacherId, token, documentId) => {
    const res = await fetch(
      `${API_BASE}/api/teachers/${teacherId}/documents/${documentId}/permanent`,
      { method: "DELETE", headers: getAuthHeaders(token) },
    );
    if (!res.ok) throw new Error("Erreur lors de la suppression");
  },

  getArchivedDocuments: async (teacherId, token) => {
    const res = await fetch(
      `${API_BASE}/api/teachers/${teacherId}/documents/archived`,
      { headers: getAuthHeaders(token) },
    );
    if (!res.ok) throw new Error("Erreur lors du chargement des archives");
    return res.json();
  },
};

// ─── Composants UI ────────────────────────────────────────────────────────────

const Badge = ({ type }) => {
  const colors = TYPE_COLORS[type] || TYPE_COLORS.RESOURCE;
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {TYPE_LABELS[type] || type}
      </Text>
    </View>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const FilterChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const DocumentCard = ({ item, onEdit, onDelete, onDeactivate }) => {
  const scaleAnim = new Animated.Value(1);

  const onPressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardIconWrap}>
            <Text style={styles.cardIcon}>{getMimeIcon(item.mimeType)}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardFileName} numberOfLines={1}>
              {item.fileName}
            </Text>
          </View>
          <Badge type={item.type} />
        </View>

        {/* Info row */}
        <View style={styles.cardInfo}>
          {item.subject && (
            <View style={styles.infoChip}>
              <Text style={styles.infoChipText}>📚 {item.subject.name}</Text>
            </View>
          )}
          {item.group && (
            <View style={styles.infoChip}>
              <Text style={styles.infoChipText}>👥 {item.group.name}</Text>
            </View>
          )}
          <View style={styles.infoChip}>
            <Text style={styles.infoChipText}>
              💾 {formatFileSize(item.fileSize)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("fr-FR")
              : "—"}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onEdit(item)}
            >
              <Text style={styles.actionBtnText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onDeactivate(item)}
            >
              <Text style={styles.actionBtnText}>📦</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger]}
              onPress={() => onDelete(item)}
            >
              <Text style={styles.actionBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Modal Formulaire ─────────────────────────────────────────────────────────
const DocumentFormModal = ({ visible, onClose, onSubmit, initial }) => {
  const [form, setForm] = useState({
    title: "",
    fileName: "",
    filePath: "",
    fileSize: "",
    mimeType: "application/pdf",
    type: "COURSE",
    subjectId: "",
    groupId: "",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || "",
        fileName: initial.fileName || "",
        filePath: initial.filePath || "",
        fileSize: String(initial.fileSize || ""),
        mimeType: initial.mimeType || "application/pdf",
        type: initial.type || "COURSE",
        subjectId: initial.subjectId || "",
        groupId: initial.groupId || "",
      });
    } else {
      setForm({
        title: "",
        fileName: "",
        filePath: "",
        fileSize: "",
        mimeType: "application/pdf",
        type: "COURSE",
        subjectId: "",
        groupId: "",
      });
    }
  }, [initial, visible]);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!form.title.trim()) return Alert.alert("Erreur", "Le titre est requis");
    if (!form.fileName.trim())
      return Alert.alert("Erreur", "Le nom du fichier est requis");
    onSubmit({ ...form, fileSize: Number(form.fileSize) || 0 });
  };

  const TYPES = ["COURSE", "EXERCISE", "CORRECTION", "RESOURCE"];
  const MIMES = [
    { label: "PDF", value: "application/pdf" },
    {
      label: "Word",
      value:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },
    {
      label: "PowerPoint",
      value:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
    { label: "Image JPEG", value: "image/jpeg" },
    { label: "Image PNG", value: "image/png" },
    { label: "Texte", value: "text/plain" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {initial ? "Modifier le document" : "Nouveau document"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalBody}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.fieldLabel}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={set("title")}
            placeholder="Ex: Cours de mathématiques - Chapitre 3"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.fieldLabel}>Nom du fichier *</Text>
          <TextInput
            style={styles.input}
            value={form.fileName}
            onChangeText={set("fileName")}
            placeholder="cours_maths_ch3.pdf"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.fieldLabel}>Chemin du fichier</Text>
          <TextInput
            style={styles.input}
            value={form.filePath}
            onChangeText={set("filePath")}
            placeholder="/uploads/documents/..."
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.fieldLabel}>Taille (en octets)</Text>
          <TextInput
            style={styles.input}
            value={form.fileSize}
            onChangeText={set("fileSize")}
            placeholder="2048000"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
          />

          <Text style={styles.fieldLabel}>Type de document</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <FilterChip
                key={t}
                label={TYPE_LABELS[t]}
                active={form.type === t}
                onPress={() => set("type")(t)}
              />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Format de fichier</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            <View style={styles.chipRow}>
              {MIMES.map((m) => (
                <FilterChip
                  key={m.value}
                  label={m.label}
                  active={form.mimeType === m.value}
                  onPress={() => set("mimeType")(m.value)}
                />
              ))}
            </View>
          </ScrollView>

          <Text style={styles.fieldLabel}>ID de la matière</Text>
          <TextInput
            style={styles.input}
            value={form.subjectId}
            onChangeText={set("subjectId")}
            placeholder="UUID de la matière"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.fieldLabel}>ID du groupe</Text>
          <TextInput
            style={styles.input}
            value={form.groupId}
            onChangeText={set("groupId")}
            placeholder="UUID du groupe"
            placeholderTextColor="#94A3B8"
          />

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
            <Text style={styles.btnSecondaryText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit}>
            <Text style={styles.btnPrimaryText}>
              {initial ? "Enregistrer" : "Créer"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Écran Principal ──────────────────────────────────────────────────────────
export default function DocumentsScreen() {
  const [token, setToken] = useState(null);
  const [teacherId, setTeacherId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Récupérer le token et l'ID du professeur depuis AsyncStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("accessToken");
        const userData = await AsyncStorage.getItem("user");
        if (storedToken && userData) {
          const user = JSON.parse(userData);
          setToken(storedToken);
          setTeacherId(user.id);
        } else {
          Alert.alert("Erreur", "Authentification requise");
        }
      } catch (e) {
        Alert.alert("Erreur", "Impossible de récupérer l'authentification");
      }
    };
    initAuth();
  }, []);

  const loadDocuments = useCallback(
    async (p = 1, reset = false) => {
      if (!token || !teacherId) return;
      try {
        if (p === 1) setLoading(true);
        const params = { page: p, limit: 10 };
        if (activeType) params.type = activeType;
        const data = showArchived
          ? await api.getArchivedDocuments(teacherId, token)
          : await api.getDocuments(teacherId, token, params);

        const list = data.documents || data || [];
        setDocuments(reset || p === 1 ? list : (prev) => [...prev, ...list]);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setPage(data.pagination.page);
        }
        if (data.statistics) setStats(data.statistics);
      } catch (e) {
        Alert.alert("Erreur", e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [teacherId, token, activeType, showArchived],
  );

  useEffect(() => {
    if (token && teacherId) loadDocuments(1, true);
  }, [token, teacherId, loadDocuments]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDocuments(1, true);
  };

  const handleCreate = async (form) => {
    try {
      await api.createDocument(teacherId, token, form);
      setShowForm(false);
      loadDocuments(1, true);
      Alert.alert("✅ Succès", "Document créé avec succès");
    } catch (e) {
      Alert.alert("Erreur", e.message);
    }
  };

  const handleEdit = async (form) => {
    try {
      await api.updateDocument(teacherId, token, editDoc.id, form);
      setEditDoc(null);
      loadDocuments(1, true);
      Alert.alert("✅ Succès", "Document modifié avec succès");
    } catch (e) {
      Alert.alert("Erreur", e.message);
    }
  };

  const handleDeactivate = (doc) => {
    Alert.alert("Archiver", `Archiver "${doc.title}" ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Archiver",
        onPress: async () => {
          try {
            await api.deactivateDocument(teacherId, token, doc.id);
            loadDocuments(1, true);
          } catch (e) {
            Alert.alert("Erreur", e.message);
          }
        },
      },
    ]);
  };

  const handleDelete = (doc) => {
    Alert.alert(
      "Supprimer définitivement",
      `Supprimer "${doc.title}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteDocument(teacherId, token, doc.id);
              loadDocuments(1, true);
            } catch (e) {
              Alert.alert("Erreur", e.message);
            }
          },
        },
      ],
    );
  };

  const filtered = documents.filter(
    (d) =>
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.fileName?.toLowerCase().includes(search.toLowerCase()),
  );

  const TYPES = [null, "COURSE", "EXERCISE", "CORRECTION", "RESOURCE"];
  const TYPE_CHIP_LABELS = {
    null: "Tous",
    COURSE: "Cours",
    EXERCISE: "Exercices",
    CORRECTION: "Corrections",
    RESOURCE: "Ressources",
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Documents</Text>
          <Text style={styles.headerSub}>
            {stats
              ? `${stats.totalDocuments} document${stats.totalDocuments > 1 ? "s" : ""}`
              : "Chargement…"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowForm(true)}
        >
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {stats && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsRow}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
          <StatCard
            icon="📄"
            label="Total"
            value={stats.totalDocuments}
            color="#4F46E5"
          />
          <StatCard
            icon="💾"
            label="Taille totale"
            value={formatFileSize(stats.totalSize)}
            color="#0891B2"
          />
          <StatCard
            icon="📊"
            label="Taille moy."
            value={formatFileSize(stats.averageSize)}
            color="#059669"
          />
        </ScrollView>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un document…"
          placeholderTextColor="#94A3B8"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Text
              style={{ color: "#94A3B8", fontSize: 18, paddingHorizontal: 8 }}
            >
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {TYPES.map((t) => (
          <FilterChip
            key={String(t)}
            label={TYPE_CHIP_LABELS[t]}
            active={activeType === t}
            onPress={() => setActiveType(t)}
          />
        ))}
        <FilterChip
          label={showArchived ? "📦 Archivés" : "📂 Archivés"}
          active={showArchived}
          onPress={() => setShowArchived((v) => !v)}
        />
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              item={item}
              onEdit={(d) => setEditDoc(d)}
              onDelete={handleDelete}
              onDeactivate={handleDeactivate}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
            />
          }
          onEndReached={() => {
            if (page < totalPages) loadDocuments(page + 1);
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>Aucun document</Text>
              <Text style={styles.emptyText}>
                Créez votre premier document en appuyant sur ＋
              </Text>
            </View>
          }
        />
      )}

      {/* Modals */}
      <DocumentFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        initial={null}
      />
      <DocumentFormModal
        visible={!!editDoc}
        onClose={() => setEditDoc(null)}
        onSubmit={handleEdit}
        initial={editDoc}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },

  // Header
  header: {
    backgroundColor: "#1E293B",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F1F5F9",
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnText: { fontSize: 24, color: "#fff", lineHeight: 28 },

  // Stats
  statsRow: { maxHeight: 88, marginTop: 12 },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    minWidth: 110,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#64748B", marginTop: 2 },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 46, fontSize: 15, color: "#1E293B" },

  // Filters
  filtersRow: { marginTop: 12, marginBottom: 4, maxHeight: 44 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#EEF2FF", borderColor: "#818CF8" },
  chipText: { fontSize: 13, color: "#64748B", fontWeight: "500" },
  chipTextActive: { color: "#4F46E5", fontWeight: "700" },

  // List
  listContent: { padding: 16, gap: 12 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardIcon: { fontSize: 22 },
  cardMeta: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 20,
  },
  cardFileName: { fontSize: 12, color: "#94A3B8", marginTop: 3 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardInfo: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  infoChip: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoChipText: { fontSize: 11, color: "#475569" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cardDate: { fontSize: 12, color: "#94A3B8" },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  actionBtnDanger: { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" },
  actionBtnText: { fontSize: 16 },

  // Empty
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: { fontSize: 16, color: "#64748B", fontWeight: "700" },
  modalBody: { flex: 1, padding: 20 },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1E293B",
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnSecondary: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  btnSecondaryText: { color: "#475569", fontWeight: "600", fontSize: 16 },
});
