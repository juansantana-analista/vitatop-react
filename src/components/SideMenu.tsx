import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../hooks/useUser';
import { getFotoUrl, listarPessoa } from '../services/user';

interface SideMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigateToLogin?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function SideMenu({ isVisible, onClose, onNavigateToLogin }: SideMenuProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userData, loading, logout } = useUser();
  const slideAnim = React.useRef(new Animated.Value(screenWidth)).current;
  const [fotoUrl, setFotoUrl] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (isVisible) {
      (async () => {
        try {
          const pessoa = await listarPessoa().catch(() => undefined);
          const url = getFotoUrl(pessoa?.foto);
          setFotoUrl(url);
        } catch {}
      })();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          if (onNavigateToLogin) {
            onNavigateToLogin();
          } else {
            (navigation as any).replace('Login');
          }
        },
      },
    ]);
  };

  const menuItems = [
    { id: 'profile', title: 'Meu Perfil', icon: 'account', onPress: () => { onClose(); (navigation as any).navigate('Profile'); } },
    { id: 'referrals', title: 'Minhas Indicações', icon: 'account-multiple-plus', onPress: () => { onClose(); (navigation as any).navigate('Referrals'); } },
    { id: 'orders', title: 'Pedidos', icon: 'package-variant', onPress: () => { onClose(); (navigation as any).navigate('Orders'); } },
    { id: 'store', title: 'Minha Loja', icon: 'store', onPress: () => { onClose(); (navigation as any).navigate('Management'); } },
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.container}>
          <StatusBar style="light" backgroundColor="#00591f" />
          <View style={[styles.safeAreaTop, { height: insets.top }]} />
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <View style={styles.headerGradient}>
                <View style={styles.headerContent}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        {fotoUrl ? (
                          <Image
                            source={{ uri: fotoUrl }}
                            style={{ width: 60, height: 60, borderRadius: 30 }}
                            resizeMode="cover"
                            onError={() => setFotoUrl(undefined)}
                          />
                        ) : loading ? (
                          <ActivityIndicator size="small" color="#00591f" />
                        ) : (
                          <Icon name="account" size={28} color="#00591f" />
                        )}
                      </View>
                      <View style={styles.avatarBadge}>
                        <Icon name="check" size={12} color="#ffffff" />
                      </View>
                    </View>
                    <View style={styles.userDetails}>
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text style={styles.loadingText}>Carregando...</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.userName} numberOfLines={1}>
                            {userData?.name || 'Usuário'}
                          </Text>
                          <Text style={styles.userEmail} numberOfLines={1}>
                            {userData?.email || 'usuario@email.com'}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Icon name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.menuItems}>
              {menuItems.map((item) => (
                <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.onPress}>
                  <View style={styles.menuItemContent}>
                    <View style={styles.menuItemIcon}>
                      <Icon name={item.icon} size={24} color="#374151" />
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                    <Icon name="chevron-right" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Icon name="logout" size={20} color="#dc2626" />
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: screenWidth * 0.78,
    backgroundColor: '#ffffff',
    zIndex: 1000,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  container: { flex: 1 },
  safeAreaTop: { backgroundColor: '#00591f' },
  safeArea: { flex: 1 },
  header: { backgroundColor: '#00591f', paddingBottom: 0 },
  headerGradient: { paddingHorizontal: 20, paddingBottom: 25, paddingTop: 10 },
  headerContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  userInfo: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  avatarBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  userDetails: { flex: 1, paddingTop: 8 },
  loadingContainer: { flexDirection: 'row', alignItems: 'center' },
  loadingText: { marginLeft: 8, fontSize: 14, color: '#e5e7eb' },
  userName: { fontSize: 20, fontWeight: '700', color: '#ffffff', marginBottom: 4, textShadowColor: 'rgba(0, 0, 0, 0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  userEmail: { fontSize: 14, color: '#e5e7eb', marginBottom: 2 },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.15)', alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  menuItems: { flex: 1, paddingTop: 8, backgroundColor: '#fafafa' },
  menuItem: { paddingHorizontal: 20, marginBottom: 1 },
  menuItemContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 16, backgroundColor: '#ffffff', borderRadius: 0, marginVertical: 0, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  menuItemIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  menuItemText: { flex: 1, fontSize: 16, color: '#374151', fontWeight: '600' },
  footer: { padding: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', shadowColor: '#dc2626', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  logoutText: { marginLeft: 10, fontSize: 16, color: '#dc2626', fontWeight: '700' },
});
