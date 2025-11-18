import { useApp } from '@/contexts/AppContext';
import { RelatorioService } from '@/service/relatorioService';
import { VendaService } from '@/service/vendaService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, ProgressBar, Text } from 'react-native-paper';

export default function DashboardScreen() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalVendido: 0,
    totalPendente: 0,
    totalLucro: 0,
    progressoMeta: 0
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const hoje = new Date().toISOString().split('T')[0];
      
      // Carregar vendas recentes
      const vendasRecentes = await VendaService.getVendasRecentes(10);
      dispatch({ type: 'SET_VENDAS', payload: vendasRecentes });
      
      // Carregar relatório do dia
      const relatorio = await RelatorioService.gerarRelatorio({ 
        periodo: 'dia',
        data_inicio: hoje,
        data_fim: hoje
      });
      
      // Carregar configurações da meta diária
      const metaDiariaValor = 200; // Valor padrão
      
      setKpis({
        totalVendido: relatorio.total_vendido,
        totalPendente: relatorio.total_pendente,
        totalLucro: relatorio.total_lucro,
        progressoMeta: Math.min((relatorio.total_vendido / metaDiariaValor) * 100, 100)
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" style={styles.loading} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* KPIs */}
        <View style={styles.kpiContainer}>
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Text style={styles.kpiLabel}>Total Vendido</Text>
              <Text style={[styles.kpiValue, styles.kpiPositive]}>
                R$ {kpis.totalVendido.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Text style={styles.kpiLabel}>Pendente</Text>
              <Text style={[styles.kpiValue, styles.kpiNegative]}>
                R$ {kpis.totalPendente.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Text style={styles.kpiLabel}>Lucro</Text>
              <Text style={[styles.kpiValue, styles.kpiProfit]}>
                R$ {kpis.totalLucro.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Meta Diária */}
        <Card style={styles.metaCard}>
          <Card.Content>
            <Text style={styles.metaTitle}>Meta Diária</Text>
            <ProgressBar 
              progress={kpis.progressoMeta / 100} 
              color="#4CAF50" 
              style={styles.progressBar}
            />
            <Text style={styles.metaText}>
              {kpis.progressoMeta.toFixed(0)}% da meta atingida
            </Text>
          </Card.Content>
        </Card>

        {/* Ações Rápidas */}
        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            onPress={() => router.push('/vendas/nova')}
            style={styles.actionButton}
            icon="plus"
          >
            Nova Venda
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => router.push('/remessas/nova')}
            style={styles.actionButton}
            icon="package-variant"
          >
            Nova Remessa
          </Button>
        </View>

        {/* Vendas Recentes */}
        <Card style={styles.vendasCard}>
          <Card.Title title="Vendas Recentes" />
          <Card.Content>
            {state.vendas.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma venda registrada hoje</Text>
            ) : (
              state.vendas.map((venda) => (
                <View key={venda.id} style={styles.vendaItem}>
                  <View style={styles.vendaInfo}>
                    <Text style={styles.vendaCliente}>{venda.cliente || 'Cliente'}</Text>
                    <Text style={styles.vendaData}>
                      {format(parseISO(venda.data), 'HH:mm', { locale: ptBR })}
                    </Text>
                  </View>
                  <View style={styles.vendaValores}>
                    <Text style={styles.vendaPreco}>R$ {venda.preco.toFixed(2)}</Text>
                    <Text style={[
                      styles.vendaStatus,
                      venda.status === 'OK' ? styles.statusOK : styles.statusPendente
                    ]}>
                      {venda.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  loading: {
    marginTop: 50,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  kpiPositive: {
    color: '#4CAF50',
  },
  kpiNegative: {
    color: '#F44336',
  },
  kpiProfit: {
    color: '#2196F3',
  },
  metaCard: {
    marginBottom: 16,
  },
  metaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  vendasCard: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  vendaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vendaInfo: {
    flex: 1,
  },
  vendaCliente: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  vendaData: {
    fontSize: 12,
    color: '#666',
  },
  vendaValores: {
    alignItems: 'flex-end',
  },
  vendaPreco: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  vendaStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusOK: {
    color: '#4CAF50',
  },
  statusPendente: {
    color: '#F44336',
  },
});