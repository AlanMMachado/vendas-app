import ConfirmationModal from '@/components/ConfirmationModal';
import Header from '@/components/Header';
import { RemessaService } from '@/service/remessaService';
import { VendaService } from '@/service/vendaService';
import { Remessa } from '@/types/Remessa';
import { Venda } from '@/types/Venda';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Edit, Trash2, XCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, RefreshControl } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

export default function DetalhesRemessaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [remessa, setRemessa] = useState<Remessa | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteVendaModalVisible, setDeleteVendaModalVisible] = useState(false);
  const [vendaToDelete, setVendaToDelete] = useState<Venda | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        carregarDetalhes();
      }
    }, [id])
  );

  const carregarDetalhes = async () => {
    try {
      setLoading(true);
      const remessaData = await RemessaService.getById(parseInt(id));
      setRemessa(remessaData);
      
      if (remessaData?.produtos) {
        const todasVendas: Venda[] = [];
        for (const produto of remessaData.produtos) {
          const vendasProduto = await VendaService.getByProduto(produto.id);
          todasVendas.push(...vendasProduto);
        }
        setVendas(todasVendas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDetalhes();
    setRefreshing(false);
  };

  const handleDelete = async () => {
    try {
      await RemessaService.delete(parseInt(id));
      router.back();
    } catch (error) {
      console.error('Erro ao excluir remessa:', error);
      // You could show an alert here
    } finally {
      setDeleteModalVisible(false);
    }
  };

  const handleDeleteVenda = async () => {
    if (!vendaToDelete) return;

    try {
      await VendaService.delete(vendaToDelete.id);
      // Recarregar dados
      await carregarDetalhes();
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      alert('Erro ao excluir venda. Tente novamente.');
    } finally {
      setDeleteVendaModalVisible(false);
      setVendaToDelete(null);
    }
  };

  if (!remessa) {
    return (
      <View style={styles.container}>
        <Header 
          title="Detalhes da Remessa" 
          subtitle="Carregando..."
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Remessa não encontrada</Text>
        </View>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'null' || dateString === '') {
      return 'Data não informada';
    }
    try {
      return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === 'null' || dateString === '') {
      return 'Data não informada';
    }
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getTotalVendido = () => {
    if (!remessa.produtos) return 0;
    return remessa.produtos.reduce((total, produto) => total + produto.quantidade_vendida, 0);
  };

  const getTotalInicial = () => {
    if (!remessa.produtos) return 0;
    return remessa.produtos.reduce((total, produto) => total + produto.quantidade_inicial, 0);
  };

  const getValorTotalVendido = () => {
    return vendas
      .filter(venda => venda.status === 'OK')
      .reduce((total, venda) => total + venda.preco, 0);
  };

  const getValorPendente = () => {
    return vendas
      .filter(venda => venda.status === 'PENDENTE')
      .reduce((total, venda) => total + venda.preco, 0);
  };

  const getProdutoById = (produtoId: number) => {
    return remessa?.produtos?.find(p => p.id === produtoId);
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Detalhes da Remessa" 
        subtitle={formatDate(remessa.data)}
        actions={
          <>
            <TouchableOpacity style={styles.editCardButton} onPress={() => router.push(`/remessas/EditarRemessaScreen?id=${id}`)}>
              <Edit size={16} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteCardButton} onPress={() => setDeleteModalVisible(true)}>
              <Trash2 size={16} color="#ffffff" />
            </TouchableOpacity>
          </>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.content}>

        {/* KPIs */}
        <View style={styles.kpisGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Inicial</Text>
            <Text style={styles.kpiValue}>{getTotalInicial()}</Text>
            <Text style={styles.kpiSubtext}>unidades</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Vendido</Text>
            <Text style={styles.kpiValue}>{getTotalVendido()}</Text>
            <Text style={styles.kpiSubtext}>unidades</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Disponível</Text>
            <Text style={styles.kpiValue}>{getTotalInicial() - getTotalVendido()}</Text>
            <Text style={styles.kpiSubtext}>unidades</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Faturamento</Text>
            <Text style={styles.kpiValue}>R$ {getValorTotalVendido().toFixed(0)}</Text>
            <Text style={styles.kpiSubtext}>recebido</Text>
          </View>
        </View>

        {/* Valor Pendente (se houver) */}
        {getValorPendente() > 0 && (
          <View style={styles.dividaCard}>
            <View style={styles.dividaHeader}>
              <XCircle size={20} color="#dc2626" />
              <Text style={styles.dividaTitle}>Valor Pendente</Text>
            </View>
            <Text style={styles.dividaValor}>R$ {getValorPendente().toFixed(2)}</Text>
            <Text style={styles.dividaSubtext}>
              {vendas.filter(v => v.status === 'PENDENTE').length} venda{vendas.filter(v => v.status === 'PENDENTE').length !== 1 ? 's' : ''} pendente{vendas.filter(v => v.status === 'PENDENTE').length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Produtos */}
        <View style={styles.produtosSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produtos</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{remessa.produtos?.length || 0}</Text>
            </View>
          </View>

          {remessa.produtos?.map((produto) => (
            <View key={produto.id} style={styles.produtoItem}>
              <View style={styles.produtoHeader}>
                <Text style={styles.produtoNome}>
                  {produto.tipo} - {produto.sabor}
                </Text>
                <Text style={styles.produtoCusto}>
                  Custo: R$ {produto.custo_producao.toFixed(2)}
                </Text>
              </View>

              <View style={styles.produtoProgress}>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>
                    {produto.quantidade_vendida}/{produto.quantidade_inicial}
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {((produto.quantidade_vendida / produto.quantidade_inicial) * 100).toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressContainer}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${(produto.quantidade_vendida / produto.quantidade_inicial) * 100}%` }
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {produto.quantidade_inicial === produto.quantidade_vendida
                    ? 'Esgotado'
                    : produto.quantidade_vendida === 0
                      ? 'Novo'
                      : `${produto.quantidade_inicial - produto.quantidade_vendida} disponíveis`
                  }
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Vendas */}
        {vendas.length > 0 && (
          <View style={styles.vendasSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vendas</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{vendas.length}</Text>
              </View>
            </View>

            {/* Lista de Vendas */}
            {vendas.slice(0, 10).map((venda) => (
              <View key={venda.id} style={styles.vendaItem}>
                <View style={styles.vendaInfo}>
                  <Text style={styles.vendaCliente}>{venda.cliente}</Text>
                  {(() => {
                    const produto = getProdutoById(venda.produto_id);
                    return produto ? (
                      <Text style={styles.vendaProduto}>
                        {produto.tipo} - {produto.sabor} ({venda.quantidade_vendida} unidade{venda.quantidade_vendida !== 1 ? 's' : ''})
                      </Text>
                    ) : null;
                  })()}
                  <Text style={styles.vendaData}>
                    {formatDateTime(venda.data)}
                  </Text>
                </View>
                <View style={styles.vendaValores}>
                  <View style={[
                    styles.vendaStatus,
                    venda.status === 'OK' ? styles.statusPago : styles.statusPendente
                  ]}>
                    <Text style={[
                      styles.vendaStatusText,
                      venda.status === 'OK' ? styles.statusTextPago : styles.statusTextPendente
                    ]}>
                      {venda.status === 'OK' ? 'PAGO' : 'PENDENTE'}
                    </Text>
                  </View>
                </View>
                <View style={styles.vendaActions}>
                  <TouchableOpacity 
                    style={styles.editVendaButton}
                    onPress={() => router.push(`/vendas/EditarVendaScreen?id=${venda.id}`)}
                  >
                    <Edit size={14} color="#2563eb" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteVendaButton}
                    onPress={() => {
                      setVendaToDelete(venda);
                      setDeleteVendaModalVisible(true);
                    }}
                  >
                    <Trash2 size={14} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {vendas.length > 10 && (
              <Text style={styles.maisVendas}>
                ... e mais {vendas.length - 10} vendas
              </Text>
            )}
          </View>
        )}

        {/* Botão Nova Venda */}
                <TouchableOpacity 
          style={styles.novaVendaButton}
          onPress={() => router.push('/vendas/NovaVendaScreen')}
        >
          <Text style={styles.novaVendaText}>+ Registrar Nova Venda</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
      )}
      
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Excluir Remessa"
        message="Tem certeza que deseja excluir esta remessa? Esta ação não pode ser desfeita e todos os produtos e vendas associadas serão removidos."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        confirmText="Excluir"
      />

      <ConfirmationModal
        visible={deleteVendaModalVisible}
        title="Excluir Venda"
        message={`Tem certeza que deseja excluir a venda de ${vendaToDelete?.cliente}? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteVenda}
        onCancel={() => {
          setDeleteVendaModalVisible(false);
          setVendaToDelete(null);
        }}
        confirmText="Excluir"
      />
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
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerObservacao: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  kpisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },
  produtosSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 20,
    marginBottom: 16,
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
  produtoItem: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  produtoHeader: {
    marginBottom: 12,
  },
  produtoNome: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  produtoCusto: {
    fontSize: 12,
    color: '#6b7280',
  },
  produtoProgress: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  vendasSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 20,
    marginBottom: 16,
  },
  vendaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    position: 'relative',
  },
  vendaInfo: {
    flex: 1,
  },
  vendaCliente: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  vendaProduto: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  vendaData: {
    fontSize: 11,
    color: '#6b7280',
  },
  vendaValores: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    alignItems: 'center',
  },
  vendaStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPago: {
    backgroundColor: '#dbeafe',
  },
  statusPendente: {
    backgroundColor: '#e5e7eb',
  },
  vendaStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusTextPago: {
    color: '#2563eb',
  },
  statusTextPendente: {
    color: '#6b7280',
  },
  vendaActions: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  editVendaButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteVendaButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maisVendas: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  novaVendaButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  novaVendaText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#dbeafe',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editCardButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteCardButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dc2626',
    padding: 10,
    marginBottom: 16,
  },
  dividaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dividaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginLeft: 8,
  },
  dividaValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  dividaSubtext: {
    fontSize: 13,
    color: '#9ca3af',
  },
});