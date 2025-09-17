import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Address = {
  id: string;
  nome_endereco?: string;
  rua: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: { sigla: string } | string;
  municipio?: { nome: string } | string;
  cep?: string;
  complemento?: string;
  principal?: 'S' | 'N';
};

type PessoaResponse = {
  status: 'success';
  data: {
    status?: 'success';
    data: {
      enderecos: any[];
    }
  }
};

export async function listarEnderecos(pessoaId?: string): Promise<Address[]> {
  const pid = pessoaId || await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'PessoaRestService',
    method: 'listarPessoa',
    pessoa_id: pid
  } as Record<string, unknown>;
  const res = await api.request<PessoaResponse>(body);
  const list = (res as any).data?.data?.enderecos || [];
  return list.map((e: any) => ({
    id: String(e.id),
    nome_endereco: e.nome_endereco,
    rua: e.rua,
    numero: e.numero,
    bairro: e.bairro,
    cidade: e.cidade || e?.municipio?.nome,
    estado: e.estado || { sigla: e?.estado?.sigla },
    municipio: e.municipio,
    cep: e.cep,
    complemento: e.complemento,
    principal: e.principal
  }));
}

export async function selecionarEndereco(enderecoId: string, pessoaId?: string): Promise<void> {
  const pid = pessoaId || await AsyncStorage.getItem('pessoaId');
  const body = {
    class: 'PagamentoSafe2payRest',
    method: 'AlterarEndereco',
    dados: { pessoa_id: pid, endereco_id: enderecoId }
  } as Record<string, unknown>;
  await api.request<any>(body);
}

export async function consultaCEP(cep: string): Promise<{ rua: string; bairro: string; cidade: string; uf: string }> {
  const body = {
    class: 'PessoaRestService',
    method: 'ConsultaCEP',
    dados: { cep }
  };
  const res = await api.request<{ status: 'success'; data: { rua: string; bairro: string; cidade: string; uf: string } }>(body);
  return (res as any).data;
}

export type SaveAddressInput = {
  id?: string;
  pessoa_id?: string;
  nome_endereco?: string;
  cep?: string;
  endereco?: string; // rua
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string; // abreviação; backend espera 'estado'
  estado?: string; // compat
  complemento?: string;
  principal?: 'S' | 'N';
};

export async function salvarEnderecoEntrega(input: SaveAddressInput): Promise<void> {
  const pessoa_id = input.pessoa_id || await AsyncStorage.getItem('pessoaId') || undefined;
  // Backend espera campos: pessoa_id, nome_endereco, cep, endereco, numero, complemento, bairro, cidade, estado, tipo, is_principal
  const cepNum = (input.cep || '').replace(/\D/g, '');
  const estado = (input.estado || input.uf || '').toString().toUpperCase();
  const dados: any = {
    pessoa_id,
    nome_endereco: input.nome_endereco,
    cep: cepNum,
    endereco: input.endereco,
    numero: input.numero,
    complemento: input.complemento,
    bairro: input.bairro,
    cidade: input.cidade,
    estado,
    tipo: 1,
    is_principal: input.principal
  };
  const body = {
    class: 'EnderecoRest',
    method: 'salvarEnderecoEntrega',
    dados
  } as Record<string, unknown>;
  await api.request<any>(body);
}


