import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar, Image, Dimensions, Animated, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { API_URL } from '../constants/api';
import { Colors } from '../constants/theme';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const heroHeight = useRef(new Animated.Value(height * 0.42)).current;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () =>
      Animated.timing(heroHeight, { toValue: height * 0.22, duration: 250, useNativeDriver: false }).start()
    );
    const hide = Keyboard.addListener('keyboardDidHide', () =>
      Animated.timing(heroHeight, { toValue: height * 0.42, duration: 250, useNativeDriver: false }).start()
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

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
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section 1 : Hero Image ── */}
        <Animated.View style={{ height: heroHeight }}>
          <Image
            source={require('../assets/images/image.png')}
            style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.35)', '#fff']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }}
          />
        </Animated.View>

        {/* ── Section 2 : Formulaire ── */}
        <View style={s.form}>

          {/* Logo + titre */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Image
              source={require('../assets/images/logo.png')}
              style={{ width: 100, height: 60, resizeMode: 'contain' }}
            />
            <Text style={s.title}>
              Espace <Text style={s.titleAccent}>Professeur</Text>
            </Text>
            <View style={s.divider} />
            <Text style={s.subtitle}>Connectez-vous pour accéder à votre espace</Text>
          </View>

          {/* Email */}
          <Text style={s.label}>Adresse email</Text>
          <View style={[s.inputWrap, emailFocused && s.inputWrapFocused]}>
             <Ionicons name="mail-outline" size={20} color={emailFocused ? Colors.teal : '#ccc'} style={{ marginRight: 8 }} />
            <TextInput
              style={s.input}
              placeholder="prof@ecole.ma"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#c4c4c4"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password */}
          <Text style={s.label}>Mot de passe</Text>
          <View style={[s.inputWrap, passwordFocused && s.inputWrapFocused, { marginBottom: 20 }]}>
            <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? Colors.teal : '#ccc'} style={{ marginRight: 8 }} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              placeholderTextColor="#c4c4c4"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={s.eyeBtn}>
              <Ionicons
                name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.teal}
              />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            style={[s.btnWrap, loading && { opacity: 0.65 }]}
          >
            <LinearGradient
              colors={[Colors.teal, '#3d9298']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.btn}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                 : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="log-in-outline" size={20} color="#fff" />
                        <Text style={s.btnText}>Se connecter</Text>
                      </View>              }
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  form: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  title: {
    fontSize: 24, fontWeight: '800', color: Colors.dark,
    textAlign: 'center', letterSpacing: 0.5, marginTop: 8,
  },
  titleAccent: { color: Colors.teal, fontWeight: '800' },
  divider: {
    width: 40, height: 3, backgroundColor: Colors.teal,
    borderRadius: 4, marginVertical: 10,
  },
  subtitle: { fontSize: 13, color: '#9ca3af', textAlign: 'center', letterSpacing: 0.3 },

  label: {
    fontSize: 13, fontWeight: '600', color: Colors.dark,
    marginBottom: 6, marginTop: 14,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 12, paddingHorizontal: 14,
    backgroundColor: '#fafafa',
  },
  inputWrapFocused: {
    borderWidth: 2,
    borderColor: Colors.teal,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.dark,
  },
  eyeBtn: { padding: 4 },

  btnWrap: {
    borderRadius: 13,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: Colors.teal,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  btn: { paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.3 },
});