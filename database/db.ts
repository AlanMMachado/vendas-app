import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('trufas.db');

// Criação das tabelas
export function initDatabase() {
    db.execAsync(`
        CREATE TABLE IF NOT EXISTS produto_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            tipo_customizado TEXT,
            preco_base REAL NOT NULL,
            preco_promocao REAL DEFAULT NULL,
            quantidade_promocao INTEGER DEFAULT NULL,
            ativo INTEGER NOT NULL DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS remessas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            observacao TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            remessa_id INTEGER NOT NULL,
            produto_config_id INTEGER,
            tipo TEXT NOT NULL,
            sabor TEXT NOT NULL,
            quantidade_inicial INTEGER NOT NULL,
            quantidade_vendida INTEGER NOT NULL DEFAULT 0,
            custo_producao REAL NOT NULL DEFAULT 0,
            preco_base REAL NOT NULL DEFAULT 0,
            preco_promocao REAL DEFAULT NULL,
            quantidade_promocao INTEGER DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(remessa_id) REFERENCES remessas(id) ON DELETE CASCADE,
            FOREIGN KEY(produto_config_id) REFERENCES produto_config(id)
        );

        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            totalComprado REAL NOT NULL DEFAULT 0,
            totalDevido REAL NOT NULL DEFAULT 0,
            numeroCompras INTEGER NOT NULL DEFAULT 0,
            ultimaCompra TEXT,
            status TEXT NOT NULL DEFAULT 'em_dia' CHECK(status IN ('devedor','em_dia')),
            dataCadastro TEXT NOT NULL,
            vendas TEXT NOT NULL DEFAULT '[]', -- JSON array com IDs das vendas
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT NOT NULL,
            data TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('OK','PENDENTE')),
            metodo_pagamento TEXT,
            total_preco REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS itens_venda (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venda_id INTEGER NOT NULL,
            produto_id INTEGER NOT NULL,
            quantidade INTEGER NOT NULL,
            preco_unitario REAL NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
            FOREIGN KEY(produto_id) REFERENCES produtos(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS configuracoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chave TEXT UNIQUE NOT NULL,
            valor TEXT NOT NULL,
            tipo TEXT NOT NULL DEFAULT 'string',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);
}
