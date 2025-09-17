import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Indicado {
  id: string;
  name: string;
  img?: string;
  title?: string;
  pid: string | null;
  created_at?: string;
  status: 'ativo' | 'inativo';
}

type Success<T> = { status: 'success'; data: T };

export interface ReferralsStats {
  totalIndicados: number;
  indicadosAtivos: number;
  indicadosInativos: number;
}

// Helper para resolver pessoaId de múltiplas fontes (mesmo usado no user.ts)
async function resolvePessoaId(pessoaId?: string): Promise<string> {
  if (pessoaId) return pessoaId;
  
  // Tenta buscar do AsyncStorage
  const stored = await AsyncStorage.getItem('pessoaId');
  if (stored) return stored;
  
  // Tenta extrair do JWT já decodificado (mesmo padrão do user.ts)
  try {
    const decoded = (globalThis as any)?.auth?.decoded;
    const fromJwt = String(decoded?.data?.pessoa_id || decoded?.pessoa_id || '');
    if (fromJwt && fromJwt !== 'null' && fromJwt !== 'undefined') {
      // Salva no AsyncStorage para próximas consultas
      try { await AsyncStorage.setItem('pessoaId', fromJwt); } catch {}
      return fromJwt;
    }
  } catch {}
  
  throw new Error('ID da pessoa não encontrado');
}

/**
 * Lista todos os membros da rede de indicações
 * Baseado na função listarEquipe do app antigo
 */
export async function listarRede(): Promise<Indicado[]> {
  try {
    const pessoaId = await resolvePessoaId();

    const body = {
      class: 'PessoaRestService',
      method: 'ListaRede',
      dados: { pessoa_id: pessoaId }
    } as Record<string, unknown>;

    const res = await api.request<Success<Indicado[]>>(body);
    const membros = (res as any).data || [];
    
    // Filtra apenas os indicados (exclui o usuário principal que tem pid === null)
    // E soma indicados diretos e indiretos como solicitado
    const indicados = membros
      .filter((membro: any) => membro.pid !== null) // Exclui o usuário principal
      .map((membro: any) => ({
        id: membro.id,
        name: membro.name || 'Nome não informado',
        img: membro.img && membro.img !== 'default-avatar.png' ? membro.img : undefined,
        title: membro.title,
        pid: membro.pid,
        created_at: membro.created_at,
        status: 'ativo' as const, // Assumindo que todos estão ativos por padrão
      }));

    return indicados;
  } catch (error) {
    console.error('Erro ao listar rede:', error);
    throw error;
  }
}

/**
 * Calcula estatísticas da rede de indicações
 */
export function calcularEstatisticas(indicados: Indicado[]): ReferralsStats {
  const totalIndicados = indicados.length;
  const indicadosAtivos = indicados.filter(i => i.status === 'ativo').length;
  const indicadosInativos = indicados.filter(i => i.status === 'inativo').length;

  return {
    totalIndicados,
    indicadosAtivos,
    indicadosInativos,
  };
}

/**
 * Formata a data de criação da conta
 */
export function formatarDataCriacao(dataString?: string): string {
  if (!dataString) {
    return 'Data não disponível';
  }

  try {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
}


/**
 * Obtém a URL da foto do indicado
 */
export function getFotoUrl(foto?: string): string | undefined {
  if (!foto || foto === 'default-avatar.png') {
    return undefined;
  }
  
  // Assumindo que as fotos estão hospedadas em algum servidor
  // Ajuste a URL base conforme necessário
  const baseUrl = 'https://api.vitatop.com.br'; // Substitua pela URL correta
  return `${baseUrl}/uploads/${foto}`;
}
