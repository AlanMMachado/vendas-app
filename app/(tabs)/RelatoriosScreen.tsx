import Header from '@/components/Header';
import { RelatorioService } from '@/service/relatorioService';
import { RelatorioResponse } from '@/types/Relatorio';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

export default function RelatoriosScreen() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [relatorio, setRelatorio] = useState<RelatorioResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Recarregar dados sempre que a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      carregarRelatorio();
    }, [periodo])
  );

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

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarRelatorio();
    setRefreshing(false);
  };

  if (!relatorio) {
    return (
      <View style={styles.container}>
        <Header title="Relatórios" subtitle="Análise de desempenho" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Erro ao carregar relatório</Text>
          <TouchableOpacity style={styles.retryButton} onPress={carregarRelatorio}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Relatórios" subtitle="Análise de desempenho" />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.content}>
        {/* Seletor de Período */}
        <View style={styles.periodoContainer}>
          <TouchableOpacity
            onPress={() => setPeriodo('dia')}
            style={[styles.periodoButton, periodo === 'dia' && styles.periodoButtonActive]}
          >
            <Text style={[styles.periodoText, periodo === 'dia' && styles.periodoTextActive]}>
              Hoje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriodo('semana')}
            style={[styles.periodoButton, periodo === 'semana' && styles.periodoButtonActive]}
          >
            <Text style={[styles.periodoText, periodo === 'semana' && styles.periodoTextActive]}>
              Semana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriodo('mes')}
            style={[styles.periodoButton, periodo === 'mes' && styles.periodoButtonActive]}
          >
            <Text style={[styles.periodoText, periodo === 'mes' && styles.periodoTextActive]}>
              Mês
            </Text>
          </TouchableOpacity>
        </View>

        {/* Cards de Resumo */}
        <View style={styles.resumoGrid}>
          <View style={styles.resumoCard}>
            <View style={styles.resumoIconContainer}>
              <Text style={styles.resumoIcon}>💰</Text>
            </View>
            <Text style={styles.resumoLabel}>Total Vendido</Text>
            <Text style={styles.resumoValue}>R$ {relatorio.total_vendido.toFixed(2)}</Text>
            <Text style={styles.resumoSubtext}>{relatorio.quantidade_vendida} unidades</Text>
          </View>

          <View style={styles.resumoCard}>
            <View style={styles.resumoIconContainer}>
              <Text style={styles.resumoIcon}>⏱️</Text>
            </View>
            <Text style={styles.resumoLabel}>Pendente</Text>
            <Text style={styles.resumoValue}>R$ {relatorio.total_pendente.toFixed(2)}</Text>
            <Text style={styles.resumoSubtext}>A receber</Text>
          </View>

          <View style={styles.resumoCard}>
            <View style={styles.resumoIconContainer}>
              <Text style={styles.resumoIcon}>📦</Text>
            </View>
            <Text style={styles.resumoLabel}>Quantidade</Text>
            <Text style={styles.resumoValue}>{relatorio.quantidade_vendida}</Text>
            <Text style={styles.resumoSubtext}>unidades</Text>
          </View>
        </View>

        {/* Produtos Mais Vendidos */}
        {relatorio.produtos_mais_vendidos.length > 0 && (
          <View style={styles.produtosSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Produtos Mais Vendidos</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{relatorio.produtos_mais_vendidos.length}</Text>
              </View>
            </View>

            <View style={styles.produtosList}>
              {relatorio.produtos_mais_vendidos.map((produto, index) => (
                <View key={index} style={styles.produtoItem}>
                  <View style={styles.produtoRank}>
                    <Text style={styles.produtoRankText}>#{index + 1}</Text>
                  </View>
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
            </View>
          </View>
        )}

        </View>
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  periodoContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  periodoButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodoButtonActive: {
    backgroundColor: '#2563eb',
  },
  periodoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodoTextActive: {
    color: '#ffffff',
  },
  resumoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  resumoCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  resumoIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resumoIcon: {
    fontSize: 20,
  },
  resumoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  resumoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  resumoSubtext: {
    fontSize: 11,
    color: '#6b7280',
  },
  produtosSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Nunito_600SemiBold',
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  produtosList: {
    gap: 12,
  },
  produtoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  produtoRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  produtoRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  produtoInfo: {
    flex: 1,
  },
  produtoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  produtoQuantidade: {
    fontSize: 12,
    color: '#6b7280',
  },
  produtoValor: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
});