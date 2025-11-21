import { db } from '@/database/db';
import { Cliente, ClienteCreateParams, ClienteUpdateParams } from '../types/Cliente';

export const ClienteService = {
    async create(cliente: ClienteCreateParams): Promise<Cliente> {
        const dataCadastro = cliente.dataCadastro || new Date().toISOString().split('T')[0];

        const result = await db.runAsync(
            `INSERT INTO clientes (nome, dataCadastro, vendas)
             VALUES (?, ?, ?)`,
            [cliente.nome, dataCadastro, '[]']
        );

        return {
            id: result.lastInsertRowId as number,
            nome: cliente.nome,
            totalComprado: 0,
            totalDevido: 0,
            numeroCompras: 0,
            ultimaCompra: '',
            status: 'em_dia',
            dataCadastro,
            vendas: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    },

    async getById(id: number): Promise<Cliente | null> {
        const result = await db.getFirstAsync<Cliente & { vendas: string }>(
            `SELECT * FROM clientes WHERE id = ?`,
            [id]
        );

        if (!result) return null;

        return {
            ...result,
            vendas: JSON.parse(result.vendas)
        };
    },

    async getByNome(nome: string): Promise<Cliente | null> {
        const result = await db.getFirstAsync<Cliente & { vendas: string }>(
            `SELECT * FROM clientes WHERE nome = ?`,
            [nome]
        );

        if (!result) return null;

        return {
            ...result,
            vendas: JSON.parse(result.vendas)
        };
    },

    async getAll(): Promise<Cliente[]> {
        const results = await db.getAllAsync<Cliente & { vendas: string }>(
            `SELECT * FROM clientes ORDER BY nome ASC`
        );

        return results.map(cliente => ({
            ...cliente,
            vendas: JSON.parse(cliente.vendas)
        }));
    },

    async update(id: number, updates: ClienteUpdateParams): Promise<void> {
        const fields = [];
        const values = [];

        if (updates.nome !== undefined) {
            fields.push('nome = ?');
            values.push(updates.nome);
        }
        if (updates.totalComprado !== undefined) {
            fields.push('totalComprado = ?');
            values.push(updates.totalComprado);
        }
        if (updates.totalDevido !== undefined) {
            fields.push('totalDevido = ?');
            values.push(updates.totalDevido);
        }
        if (updates.numeroCompras !== undefined) {
            fields.push('numeroCompras = ?');
            values.push(updates.numeroCompras);
        }
        if (updates.ultimaCompra !== undefined) {
            fields.push('ultimaCompra = ?');
            values.push(updates.ultimaCompra);
        }
        if (updates.status !== undefined) {
            fields.push('status = ?');
            values.push(updates.status);
        }

        if (fields.length === 0) return;

        fields.push('updated_at = ?');
        values.push(new Date().toISOString());

        values.push(id);

        await db.runAsync(
            `UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
    },

    async addVendaToCliente(clienteId: number, vendaId: number): Promise<void> {
        const cliente = await this.getById(clienteId);
        if (!cliente) return;

        const vendas = [...cliente.vendas, vendaId];

        await db.runAsync(
            `UPDATE clientes SET vendas = ?, updated_at = ? WHERE id = ?`,
            [JSON.stringify(vendas), new Date().toISOString(), clienteId]
        );
    },

    async removeVendaFromCliente(clienteId: number, vendaId: number): Promise<void> {
        const cliente = await this.getById(clienteId);
        if (!cliente) return;

        const vendas = cliente.vendas.filter(id => id !== vendaId);

        await db.runAsync(
            `UPDATE clientes SET vendas = ?, updated_at = ? WHERE id = ?`,
            [JSON.stringify(vendas), new Date().toISOString(), clienteId]
        );
    },

    async delete(id: number): Promise<void> {
        await db.runAsync(`DELETE FROM clientes WHERE id = ?`, [id]);
    },

    async getDevedores(): Promise<Cliente[]> {
        const results = await db.getAllAsync<Cliente & { vendas: string }>(
            `SELECT * FROM clientes WHERE status = 'devedor' ORDER BY totalDevido DESC`
        );

        return results.map(cliente => ({
            ...cliente,
            vendas: JSON.parse(cliente.vendas)
        }));
    },

    async getEstatisticas(): Promise<{
        totalClientes: number;
        totalDevedores: number;
        totalValorDevido: number;
        totalValorComprado: number;
    }> {
        const result = await db.getFirstAsync<{
            totalClientes: number;
            totalDevedores: number;
            totalValorDevido: number;
            totalValorComprado: number;
        }>(`
            SELECT
                COUNT(*) as totalClientes,
                COUNT(CASE WHEN status = 'devedor' THEN 1 END) as totalDevedores,
                SUM(totalDevido) as totalValorDevido,
                SUM(totalComprado) as totalValorComprado
            FROM clientes
        `);

        return result || {
            totalClientes: 0,
            totalDevedores: 0,
            totalValorDevido: 0,
            totalValorComprado: 0
        };
    }
};