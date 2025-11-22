export interface ProdutoCreateParams {
    tipo: string;
    sabor: string;
    quantidade_inicial: number;
    custo_producao?: number; // opcional na criação
    preco_base: number;
    preco_promocao?: number;
    quantidade_promocao?: number;
}

export interface Remessa {
    id: number;
    data: string;
    observacao?: string;
    created_at?: string;
    produtos?: Produto[];
}

export interface RemessaCreateParams {
    data: string;
    observacao?: string;
    produtos: ProdutoCreateParams[]; // agora usa a interface correta
}

export interface Produto {
    id: number;
    remessa_id: number;
    tipo: string;
    sabor: string;
    quantidade_inicial: number;
    quantidade_vendida: number;
    custo_producao: number;
    preco_base: number;
    preco_promocao?: number;
    quantidade_promocao?: number;
    created_at?: string;
}
