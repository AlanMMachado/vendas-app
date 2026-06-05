# Doce Sonho - Aplicatiov para Gerenciamento de Vendas

Aplicativo mobile para gerenciamento de vendas de trufas e sobremesas, desenvolvido com React Native e Expo.

## Funcionalidades

### 📊 Dashboard
- KPIs financeiros em tempo real (total vendido, pendente, lucro)
- Progresso de meta diária
- Lista das últimas 10 vendas
- Acesso rápido a nova venda e nova remessa

### 📦 Remessas
- Criação de novas remessas com produtos
- Visualização de estoque disponível
- Detalhes de cada remessa com vendas realizadas
- Status de disponibilidade (Nova/Esgotada/Parcial)

### 💰 Vendas
- Registro rápido de vendas
- Seleção de produtos disponíveis
- Controle de status de pagamento (OK/PENDENTE)
- Método de pagamento opcional

### 📈 Relatórios
- Análise financeira por período (dia/semana/mês)
- Produtos mais vendidos
- Total de vendas, pendente e lucro
- Quantidade de produtos vendidos

## Estrutura do Projeto

```
src/
├── app/                    # Telas e navegação
│   ├── (tabs)/            # Telas principais com navegação por abas
│   │   ├── dashboard.tsx  # Dashboard com KPIs
│   │   ├── remessas.tsx   # Listagem de remessas
│   │   └── relatorios.tsx # Análise de relatórios
│   ├── vendas/nova.tsx    # Formulário de nova venda
│   ├── remessas/nova.tsx  # Formulário de nova remessa
│   └── remessas/[id].tsx  # Detalhes da remessa
├── components/            # Componentes reutilizáveis
├── contexts/             # Context API para state management
├── database/             # Configuração do SQLite
├── service/              # Serviços de dados
├── types/                # Tipos TypeScript
└── constants/            # Constantes e temas
```

EM DESENVOLVIMENTO...
