export interface ProdutoConfig {
    id: number;
    tipo: string;
    tipo_customizado?: string;
    preco_base: number;
    preco_promocao?: number;
    quantidade_promocao?: number;
    ativo: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProdutoConfigCreateParams {
    tipo: string;
    tipo_customizado?: string;
    preco_base: number;
    preco_promocao?: number;
    quantidade_promocao?: number;
}