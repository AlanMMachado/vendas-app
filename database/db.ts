import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('trufas.db');

// Criação das tabelas
export function initDatabase() {
    db.execAsync(`
        CREATE TABLE IF NOT EXISTS remessas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            observacao TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            remessa_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            sabor TEXT NOT NULL,
            quantidade_inicial INTEGER NOT NULL,
            quantidade_vendida INTEGER NOT NULL DEFAULT 0,
            custo_producao REAL NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(remessa_id) REFERENCES remessas(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS vendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto_id INTEGER NOT NULL,
            cliente TEXT,
            quantidade_vendida INTEGER NOT NULL,
            preco REAL NOT NULL,
            data TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('OK','PENDENTE')),
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(produto_id) REFERENCES produtos(id) ON DELETE CASCADE
        );
    `);
}
