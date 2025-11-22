import ConfirmationModal from '@/components/ConfirmationModal';
import Header from '@/components/Header';
import { COLORS } from '@/constants/Colors';
import { ClienteService } from '@/service/clienteService';
import { ProdutoService } from '@/service/produtoService';
import { SyncService } from '@/service/syncService';
import { VendaService } from '@/service/vendaService';
import { Cliente } from '@/types/Cliente';
import { Produto } from '@/types/Produto';
import { Venda } from '@/types/Venda';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Clock, DollarSign, ShoppingCart, XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

export default function ClienteDetalhesScreen() {
  const { nome } = useLocalSearchParams<{ nome: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<(Omit<Cliente, 'vendas'> & {
    vendas: Venda[];
    vendasPagas: Venda[];
    vendasPendentes: Venda[];
    primeiraCompra: string;
  }) | null>(null);
  const [produtos, setProdutos] = useState<Record<number, Produto>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [modalPagamentoVisible, setModalPagamentoVisible] = useState(false);
  const [vendaParaMarcar, setVendaParaMarcar] = useState<Venda | null>(null);

  // Recarregar dados sempre que a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      if (nome) {
        carregarCliente();
      }
    }, [nome])
  );

  const carregarCliente = async () => {
    try {
      setLoading(true);
      const nomeCliente = decodeURIComponent(nome);

      // Buscar cliente do banco
      const clienteData = await ClienteService.getByNome(nomeCliente);

      if (!clienteData) {
        router.back();
        return;
      }

      // Buscar vendas do cliente
      const vendasCliente: Venda[] = [];
      for (const vendaId of clienteData.vendas) {
        const venda = await VendaService.getById(vendaId);
        if (venda) {
          vendasCliente.push(venda);
        }
      }

      // Buscar produtos para exibir nomes
      const produtoIds = [...new Set(vendasCliente.flatMap(v => v.itens.map(item => item.produto_id)))];
      const produtosMap: Record<number, Produto> = {};
      for (const id of produtoIds) {
        const produto = await ProdutoService.getById(id);
        if (produto) {
          produtosMap[id] = produto;
        }
      }
      setProdutos(produtosMap);

      // Separar vendas pagas e pendentes
      const vendasPagas = vendasCliente.filter(v => v.status === 'OK');
      const vendasPendentes = vendasCliente.filter(v => v.status === 'PENDENTE');

      // Calcular primeira compra
      const primeiraCompra = vendasCliente.length > 0 ?
        vendasCliente.reduce((maisAntiga, atual) =>
          new Date(atual.data) < new Date(maisAntiga.data) ? atual : maisAntiga
        ).data : clienteData.dataCadastro;

      setCliente({
        ...clienteData,
        vendas: vendasCliente,
        vendasPagas,
        vendasPendentes,
        primeiraCompra
      });

    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarCliente();
    setRefreshing(false);
  };

  const marcarComoPago = async (venda: Venda) => {
    try {
      await VendaService.updateStatus(venda.id, 'OK');
      
      // Carregar venda atualizada e sincronizar cliente
      const vendaAtualizada = await VendaService.getById(venda.id);
      if (vendaAtualizada) {
        await SyncService.syncClienteFromVenda(vendaAtualizada);
      }
      
      await carregarCliente(); // Recarregar dados
      setModalPagamentoVisible(false);
      setVendaParaMarcar(null);
    } catch (error) {
      console.error('Erro ao marcar venda como paga:', error);
      alert('Erro ao registrar pagamento. Tente novamente.');
    }
  };

  const calcularDiasDesdeUltimaCompra = () => {
    if (!cliente) return 0;
    const hoje = new Date();
    const ultima = new Date(cliente.ultimaCompra);
    return Math.floor((hoje.getTime() - ultima.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (!cliente) {
    return (
      <View style={styles.container}>
        <Header title="Cliente" subtitle="Carregando..." />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Cliente não encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Histórico de compras"
        subtitle={`${cliente.numeroCompras} compra${cliente.numeroCompras !== 1 ? 's' : ''}`}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.mediumBlue} />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.content}>

            {/* Status do Cliente */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View>
                  <Text style={styles.clienteNome}>{cliente.nome}</Text>
                  <Text style={styles.statusSubtitle}>
                    {cliente.status === 'devedor' ? 'Possui pendências de pagamento' :
                     'Cliente em dia com pagamentos'}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  cliente.status === 'devedor' && styles.statusDevedor,
                  cliente.status === 'em_dia' && styles.statusEmDia
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    cliente.status === 'devedor' && styles.statusTextDevedor,
                    cliente.status === 'em_dia' && styles.statusTextEmDia
                  ]}>
                    {cliente.status === 'devedor' ? 'DEVEDOR' :
                     cliente.status === 'em_dia' ? 'EM DIA' : 'EM DIA'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Métricas Principais */}
            <View style={styles.metricasContainer}>
              {/* Primeira linha: Total de Compras e Dias desde última compra */}
              <View style={styles.metricasRow}>
                <View style={styles.metricaCard}>
                  <ShoppingCart size={20} color="#059669" />
                  <Text style={styles.metricaValor}>{cliente.numeroCompras}</Text>
                  <Text style={styles.metricaLabel}>Total de Compras</Text>
                </View>

                <View style={styles.metricaCard}>
                  <Clock size={20} color="#ea580c" />
                  <Text style={styles.metricaValor}>{calcularDiasDesdeUltimaCompra()}</Text>
                  <Text style={styles.metricaLabel}>Dias Última Compra</Text>
                </View>
              </View>

              {/* Segunda linha: Total comprado esticado */}
              <View style={styles.metricaCardFull}>
                <DollarSign size={20} color="#2563eb" />
                <Text style={styles.metricaValor}>R$ {(cliente.totalComprado || 0).toFixed(2)}</Text>
                <Text style={styles.metricaLabel}>Total Comprado</Text>
              </View>
            </View>

            {/* Valor Devido (se houver) */}
            {cliente.totalDevido > 0 && (
              <View style={styles.dividaCard}>
                <View style={styles.dividaHeader}>
                  <XCircle size={20} color="#dc2626" />
                  <Text style={styles.dividaTitle}>Valor em Aberto</Text>
                </View>
                <Text style={styles.dividaValor}>R$ {(cliente.totalDevido || 0).toFixed(2)}</Text>
                <Text style={styles.dividaSubtext}>
                  {cliente.vendasPendentes.length} venda{cliente.vendasPendentes.length !== 1 ? 's' : ''} pendente{cliente.vendasPendentes.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* Histórico de Compras */}
            <View style={styles.historicoSection}>
              <Text style={styles.sectionTitle}>Histórico de Compras</Text>

              {cliente.vendas.map((venda) => (
                <View key={venda.id} style={styles.vendaItem}>
                  <View style={styles.vendaInfo}>
                    <View style={styles.vendaHeader}>
                      <Text style={styles.vendaProduto}>
                        Venda #{venda.id}
                      </Text>
                    </View>

                    <View style={styles.vendaDetalhes}>
                      {venda.itens.map((item, index) => {
                        const produto = produtos[item.produto_id];
                        return (
                          <Text key={index} style={styles.vendaQuantidade}>
                            • {produto ? `${produto.tipo} ${produto.sabor}` : 'Produto'} - {item.quantidade}un (R$ {item.preco_unitario.toFixed(2)})
                          </Text>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.vendaValor}>
                    <Text style={styles.vendaPreco}>R$ {venda.total_preco.toFixed(2)}</Text>
                    <Text style={styles.vendaData}>
                      {format(parseISO(venda.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </Text>
                    {venda.status === 'PENDENTE' && (
                      <TouchableOpacity
                        style={styles.marcarPagoBotao}
                        onPress={() => {
                          setVendaParaMarcar(venda);
                          setModalPagamentoVisible(true);
                        }}
                      >
                        <Text style={styles.marcarPagoTexto}>Marcar Pago</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.miniStatusBadge}>
                    {venda.status === 'OK' ? (
                      <CheckCircle size={16} color="#059669" />
                    ) : (
                      <Clock size={16} color="#d97706" />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Modal de Confirmação de Pagamento */}
      <ConfirmationModal
        visible={modalPagamentoVisible}
        title="Confirmar Pagamento"
        message={`Marcar a venda de R$ ${(vendaParaMarcar?.total_preco || 0).toFixed(2)} como paga?`}
        onConfirm={() => vendaParaMarcar && marcarComoPago(vendaParaMarcar)}
        onCancel={() => {
          setModalPagamentoVisible(false);
          setVendaParaMarcar(null);
        }}
        confirmText="Confirmar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.softGray,
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
    color: COLORS.textMedium,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    padding: 20,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clienteNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 13,
    color: COLORS.textMedium,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusDevedor: {
    backgroundColor: COLORS.softGray,
    borderColor: COLORS.error,
  },
  statusEmDia: {
    backgroundColor: COLORS.softGray,
    borderColor: COLORS.green,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextDevedor: {
    color: COLORS.error,
  },
  statusTextEmDia: {
    color: COLORS.green,
  },
  metricasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricasContainer: {
    marginBottom: 16,
  },
  metricasRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricaCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    padding: 16,
    alignItems: 'center',
  },
  metricaCardFull: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    padding: 16,
    alignItems: 'center',
  },
  metricaValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 8,
    marginBottom: 4,
  },
  metricaLabel: {
    fontSize: 12,
    color: COLORS.textMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
  dividaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
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
    color: COLORS.error,
    marginLeft: 8,
  },
  dividaValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 4,
  },
  dividaSubtext: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  historicoSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  vendaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.softGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
    marginBottom: 8,
    position: 'relative',
  },
  vendaInfo: {
    flex: 1,
    paddingRight: 24,
  },
  vendaHeader: {
    marginBottom: 8,
  },
  vendaProduto: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  miniStatusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  vendaDetalhes: {
    marginBottom: 8,
  },
  vendaQuantidade: {
    fontSize: 12,
    color: COLORS.textMedium,
  },
  vendaData: {
    fontSize: 11,
    color: COLORS.textMedium,
    marginTop: 4,
  },
  vendaValor: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  vendaPreco: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  marcarPagoBotao: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  marcarPagoTexto: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  miniStatusPago: {
    backgroundColor: COLORS.green,
    borderRadius: 12,
    padding: 4,
  },
  miniStatusPendente: {
    backgroundColor: COLORS.warning,
    borderRadius: 12,
    padding: 4,
  },
});