export const Colors = {
  // Couleurs principales
  teal: '#5DAEB3',
  tealDark: '#4A9CA1',
  dark: '#2E2F39',
  gris: '#F2F2F2',
  blanc: '#FFFFFF',

  // Sections
  amber: '#F59E0B',   // SOUTIEN, warnings
  rose: '#F43F5E',    // LANGUE, erreurs
  tealVert: '#14B8A6', // FORMATION
  bleu: '#2563EB',    // SCOLAIRE, info

  // Statuts
  success: '#16a34a', // Succès, approuvé
  error: '#dc2626',   // Erreurs, refusé
  warning: '#d97706', // En attente
  info: '#2563EB',    // Excusé, info
};

// Couleur par section de cours
export const sectionColor = (section) => ({
  SCOLAIRE: Colors.bleu,
  SOUTIEN: Colors.amber,
  LANGUE: Colors.rose,
  FORMATION: Colors.tealVert,
})[section] || Colors.teal;

// Couleur par statut d'absence
export const statusColor = (status) => ({
  PENDING: Colors.warning,
  APPROVED: Colors.success,
  REJECTED: Colors.error,
})[status] || Colors.dark;
