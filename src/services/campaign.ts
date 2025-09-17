import { api } from './api';

export interface CampaignCategory {
  id: string;
  nome: string;
}

export interface Campaign {
  id: string;
  titulo: string;
  subtitulo?: string;
  imagem?: string;
  data_inicio: string;
  data_fim?: string;
  categoria_id: string;
  tag?: string;
  link?: string;
}

export interface CampaignResponse {
  status: string;
  data: {
    status: string;
    data: Campaign[] | CampaignCategory[];
  };
  message?: string;
}

// Função para carregar as categorias de campanha
export async function carregarCategoriasCampanha(): Promise<CampaignCategory[]> {
  try {
    const response = await api.request<CampaignResponse>({
      class: 'CampanhaRestService',
      method: 'listarCategoriasCampanha',
    });

    if (response.status === 'success' && response.data?.status === 'success') {
      return response.data.data as CampaignCategory[];
    }

    throw new Error(response.message || 'Erro ao carregar categorias');
  } catch (error) {
    console.error('Erro ao carregar categorias de campanha:', error);
    throw error;
  }
}

// Função para listar campanhas, opcionalmente filtradas por categoria
export async function listarCampanhas(categoriaId?: string): Promise<Campaign[]> {
  try {
    const body: any = {
      class: 'CampanhaRestService',
      method: 'listarCampanhas',
    };

    // Adiciona o filtro por categoria se não for "all" ou undefined
    if (categoriaId && categoriaId !== 'all') {
      body.categoria_id = categoriaId;
    }

    const response = await api.request<CampaignResponse>(body);

    if (response.status === 'success' && response.data?.status === 'success') {
      return response.data.data as Campaign[];
    }

    throw new Error(response.message || 'Erro ao carregar campanhas');
  } catch (error) {
    console.error('Erro ao listar campanhas:', error);
    throw error;
  }
}

// Função auxiliar para obter a classe CSS baseada na categoria
export function getCategoriaClass(categoriaId: string): string {
  switch (categoriaId) {
    case '1':
      return 'promocao';
    case '2':
      return 'saude';
    case '3':
      return 'data-especial';
    case '4':
      return 'lancamento';
    default:
      return '';
  }
}

// Função auxiliar para obter o nome da categoria pelo ID
export function getCategoriaLabel(categoriaId: string): string {
  switch (categoriaId) {
    case '1':
      return 'Promoção';
    case '2':
      return 'Saúde';
    case '3':
      return 'Data Especial';
    case '4':
      return 'Lançamento';
    default:
      return 'Campanha';
  }
}

// Função para formatar data
export function formatarData(data: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  return data.toLocaleDateString('pt-BR', options);
}

// Função para obter a URL completa da imagem da campanha
export function getCampaignImageUrl(imagem?: string): any {
  if (!imagem) {
    return require('../../assets/produto-1.jpg'); // Imagem padrão local
  }
  
  // Se a imagem já é uma URL completa
  if (imagem.startsWith('http')) {
    return { uri: imagem };
  }
  
  // Remove a barra inicial se existir para evitar duplicação
  const cleanPath = imagem.startsWith('/') ? imagem.slice(1) : imagem;
  
  // Constrói a URL baseada no servidor
  return { uri: `https://vitatop.tecskill.com.br/${cleanPath}` };
}
