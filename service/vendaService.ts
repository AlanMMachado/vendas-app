import { db } from '@/database/db';
import { Venda, VendaCreateParams } from '../types/Venda';

export const VendaService = {
    async create(venda: VendaCreateParams): Promise<Venda> {
        const result = await db.runAsync(
            `INSERT INTO vendas (produto_id, cliente, quantidade_vendida, preco, data, status, metodo_pagamento)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                venda.produto_id,
                venda.cliente,
                venda.quantidade_vendida,
                venda.preco,
                venda.data,
                venda.status,
                venda.metodo_pagamento || null
            ]
        );

        // Atualiza quantidade vendida do produto
        await db.runAsync(
            `UPDATE produtos
             SET quantidade_vendida = quantidade_vendida + ?
             WHERE id = ?`,
            [venda.quantidade_vendida, venda.produto_id]
        );

        const novaVenda = {
            id: result.lastInsertRowId as number,
            ...venda,
            metodo_pagamento: venda.metodo_pagamento || undefined,
            created_at: new Date().toISOString()
        };

        return novaVenda;
    },

    async getByProduto(produtoId: number): Promise<Venda[]> {
        return await db.getAllAsync<Venda>(
            `SELECT * FROM vendas WHERE produto_id = ? ORDER BY data DESC`,
            [produtoId]
        );
    },

    async getById(id: number): Promise<Venda | null> {
        return await db.getFirstAsync<Venda>(
            `SELECT * FROM vendas WHERE id = ?`,
            [id]
        );
    },

    async updateStatus(id: number, status: 'OK' | 'PENDENTE'): Promise<void> {
        await db.runAsync(
            `UPDATE vendas SET status = ? WHERE id = ?`,
            [status, id]
        );
    },

    async update(id: number, venda: Partial<VendaCreateParams>): Promise<void> {
        const fields = [];
        const values = [];
        
        if (venda.produto_id !== undefined) {
            fields.push('produto_id = ?');
            values.push(venda.produto_id);
        }
        if (venda.cliente !== undefined) {
            fields.push('cliente = ?');
            values.push(venda.cliente);
        }
        if (venda.quantidade_vendida !== undefined) {
            fields.push('quantidade_vendida = ?');
            values.push(venda.quantidade_vendida);
        }
        if (venda.preco !== undefined) {
            fields.push('preco = ?');
            values.push(venda.preco);
        }
        if (venda.data !== undefined) {
            fields.push('data = ?');
            values.push(venda.data);
        }
        if (venda.status !== undefined) {
            fields.push('status = ?');
            values.push(venda.status);
        }
        if (venda.metodo_pagamento !== undefined) {
            fields.push('metodo_pagamento = ?');
            values.push(venda.metodo_pagamento);
        }
        
        if (fields.length === 0) return;
        
        values.push(id);
        
        await db.runAsync(
            `UPDATE vendas SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        // Se quantidade_vendida mudou, ajustar no produto
        if (venda.quantidade_vendida !== undefined) {
            const vendaAtual = await this.getById(id);
            if (vendaAtual) {
                const diferenca = venda.quantidade_vendida - vendaAtual.quantidade_vendida;
                if (diferenca !== 0) {
                    await db.runAsync(
                        `UPDATE produtos 
                         SET quantidade_vendida = quantidade_vendida + ?
                         WHERE id = ?`,
                        [diferenca, vendaAtual.produto_id]
                    );
                }
            }
        }
    },

    async getByPeriodo(inicio: string, fim: string): Promise<Venda[]> {
        return await db.getAllAsync<Venda>(
            `SELECT * FROM vendas WHERE DATE(data) BETWEEN ? AND ? ORDER BY data DESC`,
            [inicio, fim]
        );
    },

    async getVendasRecentes(limit: number = 10): Promise<Venda[]> {
        return await db.getAllAsync<Venda>(
            `SELECT * FROM vendas ORDER BY created_at DESC LIMIT ?`,
            [limit]
        );
    },

    async getTotalVendidoPorPeriodo(inicio: string, fim: string): Promise<number> {
        const result = await db.getFirstAsync<{ total: number }>(
            `SELECT SUM(preco) as total FROM vendas WHERE DATE(data) BETWEEN ? AND ? AND status = 'OK'`,
            [inicio, fim]
        );
        return result?.total || 0;
    },

    async getTotalPendentePorPeriodo(inicio: string, fim: string): Promise<number> {
        const result = await db.getFirstAsync<{ total: number }>(
            `SELECT SUM(preco) as total FROM vendas WHERE DATE(data) BETWEEN ? AND ? AND status = 'PENDENTE'`,
            [inicio, fim]
        );
        return result?.total || 0;
    },

    async delete(id: number): Promise<void> {
        // Busca a venda antes de deletar para ajustar a quantidade
        const venda = await this.getById(id);
        if (venda) {
            await db.runAsync(
                `UPDATE produtos
                 SET quantidade_vendida = quantidade_vendida - ?
                 WHERE id = ?`,
                [venda.quantidade_vendida, venda.produto_id]
            );
        }

        await db.runAsync(`DELETE FROM vendas WHERE id = ?`, [id]);
    }
};