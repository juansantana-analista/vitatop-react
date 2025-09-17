import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserData {
  id: string;
  name: string;
  email: string;
  pessoaId?: string;
  codigoIndicador?: string;
  avatar?: string;
}

export function useUser() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Tenta buscar do globalThis primeiro (mais rápido)
      const globalAuth = (globalThis as any)?.auth;
      if (globalAuth?.decoded) {
        const decoded = globalAuth.decoded;
        const userData = extractUserData(decoded);
        if (userData) {
          setUserData(userData);
          setLoading(false);
          return;
        }
      }

      // Se não encontrou no globalThis, busca do AsyncStorage
      const authClaims = await AsyncStorage.getItem('auth_claims');
      if (authClaims) {
        const decoded = JSON.parse(authClaims);
        const userData = extractUserData(decoded);
        if (userData) {
          setUserData(userData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractUserData = (decoded: any): UserData | null => {
    try {
      // Tenta diferentes estruturas possíveis do JWT
      const data = decoded?.data || decoded;
      
      const id = String(data?.id || data?.sub || data?.userid || '');
      const name = String(data?.username || data?.name || data?.nome || 'Usuário');
      const email = String(data?.usermail || data?.email || data?.user_email || '');
      const pessoaId = String(data?.pessoa_id || '');
      const codigoIndicador = String(data?.codigo_indicador || '');

      if (!id) return null;

      return {
        id,
        name,
        email,
        pessoaId: pessoaId || undefined,
        codigoIndicador: codigoIndicador || undefined,
      };
    } catch (error) {
      console.error('Erro ao extrair dados do usuário:', error);
      return null;
    }
  };

  const refreshUserData = () => {
    loadUserData();
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'auth_token',
        'auth_claims',
        'userId',
        'pessoaId',
        'selectedAddressId'
      ]);
      (globalThis as any).auth = null;
      setUserData(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return {
    userData,
    loading,
    refreshUserData,
    logout,
  };
}
