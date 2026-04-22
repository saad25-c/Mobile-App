import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../store/authStore';

const API_URL = 'https://teacher-worker.abde-school.workers.dev';

const C = {
  teal: '#2563EB',
  dark: '#1e1e1e',
  gris: '#f5f5f5',
  blanc: '#ffffff',
};

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (res.status === 200) {
        await setAuth(data.accessToken, data.user, data.teacherProfile);
        router.replace('/(tabs)');
      } else if (res.status === 401) {
        Alert.alert('Connexion échouée', 'Identifiants incorrects.');
      } else if (res.status === 400) {
        Alert.alert('Erreur', data.details?.[0]?.message || 'Données invalides.');
      } else {
        Alert.alert('Erreur', 'Erreur interne du serveur.');
      }
    } catch {
      Alert.alert('Serveur indisponible', 'Impossible de contacter le serveur. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <Image source={require('../assets/images/image.png')} style={s.hero} resizeMode="cover" />

        <View style={s.card}>
          <Image source={require('../assets/images/logo.png')} style={s.logo} resizeMode="contain" />
          <Text style={s.title}>Espace Professeur</Text>
          <Text style={s.subtitle}>Connectez-vous pour accéder à votre espace</Text>

          <Text style={s.label}>Adresse email</Text>
          <TextInput
            style={s.input}
            placeholder="prof@ecole.ma"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />

          <Text style={s.label}>Mot de passe</Text>
          <View style={s.pwdWrap}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn}>
              <Text style={{ fontSize: 18 }}>{showPwd ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Se connecter</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.gris },
  hero: { width: '100%', height: 260 },
  card: {
    backgroundColor: C.blanc, marginHorizontal: 20, marginTop: -30,
    borderRadius: 20, padding: 24, elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12,
  },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: C.dark, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: C.dark, marginBottom: 6 },
  input: { backgroundColor: C.gris, borderRadius: 10, padding: 13, fontSize: 14, color: C.dark, marginBottom: 14 },
  pwdWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.gris, borderRadius: 10, marginBottom: 20, paddingRight: 12 },
  eyeBtn: { padding: 4 },
  btn: { backgroundColor: C.teal, borderRadius: 12, padding: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
});
