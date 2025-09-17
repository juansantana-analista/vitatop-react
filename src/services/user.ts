import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoadAllResponse = {
  status: 'success';
  data: any[] | { data?: any[] };
};

export async function obterPessoaIdPorUserId(userId: string): Promise<string | undefined> {
  const body = {
    class: 'PessoaRest',
    method: 'loadAll',
    filters: [["user_id", "=", userId]],
    order: 'id'
  } as Record<string, unknown>;
  const res = await api.request<LoadAllResponse>(body);
  const list = Array.isArray((res as any).data) ? (res as any).data : (res as any).data?.data || [];
  const pessoa = list?.[0];
  return pessoa ? String(pessoa.id) : undefined;
}

// Helper para resolver pessoaId de múltiplas fontes
async function resolvePessoaId(explicitPessoaId?: string): Promise<string> {
  if (explicitPessoaId) return explicitPessoaId;
  const stored = await AsyncStorage.getItem('pessoaId');
  if (stored) return stored;
  try {
    const decoded = (globalThis as any)?.auth?.decoded;
    const fromJwt = String(decoded?.data?.pessoa_id || decoded?.pessoa_id || '');
    if (fromJwt) return fromJwt;
  } catch {}
  try {
    const userId = (await AsyncStorage.getItem('userId')) || String((globalThis as any)?.auth?.decoded?.data?.id || (globalThis as any)?.auth?.decoded?.sub || '');
    if (userId) {
      const pid = await obterPessoaIdPorUserId(userId);
      if (pid) {
        try { await AsyncStorage.setItem('pessoaId', pid); } catch {}
        return pid;
      }
    }
  } catch {}
  throw new Error('PessoaId não encontrado');
}

type ListarPessoaApiResponse = {
  status: 'success';
  data: {
    status: 'success' | 'sucess';
    data: {
      pessoa: {
        id: string | number;
        nome?: string;
        email?: string;
        celular?: string;
        foto?: string;
      }
    }
  }
};

export async function listarPessoa(pessoaId?: string) {
  const pid = await resolvePessoaId(pessoaId);
  const body = {
    class: 'PessoaRestService',
    method: 'listarPessoa',
    pessoa_id: pid,
  } as Record<string, unknown>;
  const res = await api.request<ListarPessoaApiResponse>(body);
  const pessoa = (res as any)?.data?.data?.pessoa || {};
  return pessoa as { id: string | number; nome?: string; email?: string; celular?: string; foto?: string };
}

export function getFotoUrl(relativePath?: string) {
  if (!relativePath) return undefined;
  const clean = String(relativePath).replace(/^\/+/, '');
  return `https://vitatop.tecskill.com.br/${clean}`;
}

type SuccessResponse = { 
  status: 'success'; 
  data?: { 
    status: 'success' | 'sucess'; 
    data?: any;
    message?: string;
  } 
};

export async function editarPessoaPerfil(input: { nome: string; celular: string; pessoaId?: string }) {
  const pid = await resolvePessoaId(input.pessoaId);
  const body = {
    class: 'PessoaRestService',
    method: 'editarPessoa',
    id: pid,
    nome: input.nome,
    celular: input.celular,
  } as Record<string, unknown>;
  const res = await api.request<SuccessResponse>(body);
  return res;
}

export async function editarSenha(input: { senhaAtual: string; novaSenha: string; pessoaId?: string }) {
  const pid = await resolvePessoaId(input.pessoaId);
  const body = {
    class: 'PessoaRestService',
    method: 'editarPessoa',
    id: pid,
    senha_atual: input.senhaAtual,
    senha: input.novaSenha,
  } as Record<string, unknown>;
  const res = await api.request<SuccessResponse>(body);
  return res;
}

export async function editarFotoPerfil(input: { fotoBase64: string; pessoaId?: string }) {
  const pid = await resolvePessoaId(input.pessoaId);
  const body = {
    class: 'PessoaRestService',
    method: 'editarPessoa',
    id: pid,
    foto_base64: input.fotoBase64,
  } as Record<string, unknown>;
  const res = await api.request<SuccessResponse>(body);
  return res;
}


