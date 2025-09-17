import { api } from './api';

// Tipos mínimos baseados no app antigo
export type Banner = { url_arquivo: string; titulo: string };
export type Categoria = { id: string; nome: string };
export type Produto = {
  id: string;
  nome: string;
  preco_lojavirtual: number;
  imagem_url?: string;
  categoria_produto?: string;
};

export type ProdutoDetalhe = {
  id: string;
  nome: string;
  preco: number; // preço desconto/pague
  preco_lojavirtual: number; // preço revenda
  fotos: string[]; // urls absolutas
  beneficios?: Array<{ id: string; nome: string; descricao?: string; icone?: string; cor_icone?: string }>; 
  contra_indicacoes?: Array<{ titulo: string }>;
};

export type ProdutoLink = {
  id: string;
  tipo_link: string; // '1' landing, '2' checkout, etc
  link_url: string;
};

type SuccessResponse<T> = { status: 'success'; data: T };

export async function listarBanners(): Promise<Banner[]> {
  const body = {
    class: 'BannerRest',
    method: 'ListaBanner',
    dados: { local: 1 }
  };
  const res = await api.request<SuccessResponse<Banner[]>>(body);
  return res.data;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const body = {
    class: 'ProdutoCategoriaRest',
    method: 'listarCategorias'
  };
  const res = await api.request<SuccessResponse<{ data: Categoria[] }>>(body);
  return res.data.data;
}

export async function listarProdutos(params: { search?: string; categoriaId?: string; limit?: number; offset?: number }): Promise<Produto[]> {
  const body = {
    class: 'ProdutoVariacaoRest',
    method: 'listarProdutos',
    categoria_id: params.categoriaId,
    search: params.search || ''
  } as Record<string, unknown>;
  if (typeof params.limit === 'number') body.limit = params.limit;
  if (typeof params.offset === 'number') body.offset = params.offset;
  const res = await api.request<SuccessResponse<{ data: any[] }>>(body);
  const host = 'https://vitatop.tecskill.com.br/';
  return (res.data.data || []).map((item: any) => {
    const rawFoto: string | undefined = item.foto;
    let imagem_url: string | undefined = undefined;
    if (rawFoto) {
      if (rawFoto.startsWith('http://') || rawFoto.startsWith('https://')) {
        imagem_url = rawFoto;
      } else if (rawFoto.startsWith('/')) {
        imagem_url = host.replace(/\/$/, '') + rawFoto;
      } else {
        imagem_url = host + rawFoto;
      }
    }
    return {
      id: String(item.id),
      nome: item.nome,
      preco_lojavirtual: Number(item.preco_lojavirtual || 0),
      imagem_url,
      categoria_produto: item.categoria_produto ? String(item.categoria_produto) : undefined
    } as Produto;
  });
}

export async function obterProdutoCompleto(produtoId: string): Promise<ProdutoDetalhe> {
  const body = {
    class: 'ProdutoVariacaoRest',
    method: 'obterProdutoCompleto',
    produto_id: produtoId
  };
  const res = await api.request<SuccessResponse<{ data: any }>>(body);
  const host = 'https://vitatop.tecskill.com.br/';
  const d = (res as any).data.data || (res as any).data || {};
  const fotos: string[] = [];
  const pushFoto = (path?: string) => {
    if (!path) return;
    if (path.startsWith('http://') || path.startsWith('https://')) fotos.push(path);
    else if (path.startsWith('/')) fotos.push(host.replace(/\/$/, '') + path);
    else fotos.push(host + path);
  };
  pushFoto(d.foto);
  pushFoto(d.foto2);
  pushFoto(d.foto3);
  pushFoto(d.foto4);
  pushFoto(d.foto5);
  pushFoto(d.foto6);
  if (fotos.length === 0) fotos.push(host + 'img/default.png');

  const beneficios = Array.isArray(d.beneficios) ? d.beneficios.map((b: any) => ({
    id: String(b.id ?? b.codigo ?? Math.random()),
    nome: b.nome ?? b.titulo ?? 'Benefício',
    descricao: b.descricao,
    icone: b.icone,
    cor_icone: b.cor_icone
  })) : undefined;

  const contra = Array.isArray(d.contra_indicacoes) ? d.contra_indicacoes.map((c: any) => ({
    titulo: c.titulo ?? String(c)
  })) : undefined;

  return {
    id: String(d.id ?? produtoId),
    nome: d.nome ?? '',
    preco: Number(d.preco ?? 0),
    preco_lojavirtual: Number(d.preco_lojavirtual ?? 0),
    fotos,
    beneficios,
    contra_indicacoes: contra
  };
}

export async function listarLinksProduto(produtoId: string): Promise<ProdutoLink[]> {
  const body = {
    class: 'ProdutoLinkRest',
    method: 'loadAll',
    filters: [["produto_id", "=", produtoId]]
  };
  const res = await api.request<{ status: 'success'; data: any[] }>(body);
  const list = (res as any).data || [];
  return list.map((it: any) => ({ id: String(it.id), tipo_link: String(it.tipo_link), link_url: String(it.link_url) }));
}


