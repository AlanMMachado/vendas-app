export interface ItemVenda {
    id: number;
    venda_id: number;
    produto_id: number;
    quantidade: number;
    preco_unitario: number;
}

export interface Venda {
    id: number;
    cliente: string;
    data: string; // ISO string
    status: 'OK' | 'PENDENTE';
    metodo_pagamento?: string;
    total_preco: number;
    itens: ItemVenda[];
    created_at?: string;
}

export interface VendaCreateParams {
    cliente: string;
    data: string;
    status: 'OK' | 'PENDENTE';
    metodo_pagamento?: string;
    itens: Omit<ItemVenda, 'id' | 'venda_id'>[];
}

export interface VendaUpdateParams {
    cliente?: string;
    data?: string;
    status?: 'OK' | 'PENDENTE';
    metodo_pagamento?: string;
    itens?: Omit<ItemVenda, 'id' | 'venda_id'>[];
}