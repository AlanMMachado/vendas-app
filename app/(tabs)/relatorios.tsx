import { RelatorioService } from '@/service/relatorioService';
import { RelatorioResponse } from '@/types/Relatorio';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, SegmentedButtons, Text } from 'react-native-paper';

export default function RelatoriosScreen() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [relatorio, setRelatorio] = useState<RelatorioResponse | null>(null);

  useEffect(() => {
    carregarRelatorio();
  }, [periodo]);

  const carregarRelatorio = async () => {
    try {
      setLoading(true);
      const relatorioData = await RelatorioService.gerarRelatorio({ periodo });
      setRelatorio(relatorioData);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
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

  if (!relatorio) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erro ao carregar relatório</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Seletor de Período */}
        <Card style={styles.periodoCard}>
          <Card.Content>
            <SegmentedButtons
              value={periodo}
              onValueChange={(value) => setPeriodo(value as 'dia' | 'semana' | 'mes')}
              buttons={[
                { value: 'dia', label: 'Hoje' },
                { value: 'semana', label: 'Semana' },
                { value: 'mes', label: 'Mês' },
              ]}
            />
          </Card.Content>
        </Card>

        {/* Resumo Financeiro */}
        <Card style={styles.resumoCard}>
          <Card.Title title="Resumo Financeiro" />
          <Card.Content>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Total Vendido:</Text>
              <Text style={[styles.resumoValor, styles.valorPositivo]}>
                R$ {relatorio.total_vendido.toFixed(2)}
              </Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Total Pendente:</Text>
              <Text style={[styles.resumoValor, styles.valorNegativo]}>
                R$ {relatorio.total_pendente.toFixed(2)}
              </Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Lucro Total:</Text>
              <Text style={[styles.resumoValor, styles.valorLucro]}>
                R$ {relatorio.total_lucro.toFixed(2)}
              </Text>
            </View>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Quantidade Vendida:</Text>
              <Text style={styles.resumoValor}>
                {relatorio.quantidade_vendida} unidades
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Produtos Mais Vendidos */}
        {relatorio.produtos_mais_vendidos.length > 0 && (
          <Card style={styles.produtosCard}>
            <Card.Title title="Produtos Mais Vendidos" />
            <Card.Content>
              {relatorio.produtos_mais_vendidos.map((produto, index) => (
                <View key={index} style={styles.produtoItem}>
                  <View style={styles.produtoInfo}>
                    <Text style={styles.produtoNome}>{produto.produto}</Text>
                    <Text style={styles.produtoQuantidade}>
                      {produto.quantidade} unidades
                    </Text>
                  </View>
                  <Text style={styles.produtoValor}>
                    R$ {produto.valor_total.toFixed(2)}
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Botão de Atualizar */}
        <Button 
          mode="outlined" 
          onPress={carregarRelatorio}
          style={styles.atualizarButton}
          icon="refresh"
        >
          Atualizar Relatório
        </Button>
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
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#F44336',
  },
  periodoCard: {
    marginBottom: 16,
  },
  resumoCard: {
    marginBottom: 16,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resumoLabel: {
    fontSize: 16,
    color: '#666',
  },
  resumoValor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  valorPositivo: {
    color: '#4CAF50',
  },
  valorNegativo: {
    color: '#F44336',
  },
  valorLucro: {
    color: '#2196F3',
  },
  produtosCard: {
    marginBottom: 16,
  },
  produtoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  produtoQuantidade: {
    fontSize: 14,
    color: '#666',
  },
  produtoValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  atualizarButton: {
    marginTop: 16,
  },
});