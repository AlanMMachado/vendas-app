import { RemessaService } from '@/service/remessaService';
import { Remessa } from '@/types/Remessa';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, FAB, Text } from 'react-native-paper';

export default function RemessasScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [remessas, setRemessas] = useState<Remessa[]>([]);

  useEffect(() => {
    carregarRemessas();
  }, []);

  const carregarRemessas = async () => {
    try {
      setLoading(true);
      const todasRemessas = await RemessaService.getAll();
      setRemessas(todasRemessas);
    } catch (error) {
      console.error('Erro ao carregar remessas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusRemessa = (remessa: Remessa) => {
    if (!remessa.produtos || remessa.produtos.length === 0) return 'Sem produtos';
    
    const totalInicial = remessa.produtos.reduce((sum, p) => sum + p.quantidade_inicial, 0);
    const totalVendido = remessa.produtos.reduce((sum, p) => sum + p.quantidade_vendida, 0);
    const disponivel = totalInicial - totalVendido;
    
    if (disponivel === 0) return 'Esgotada';
    if (totalVendido === 0) return 'Nova';
    return `${disponivel} disponíveis`;
  };

  const getStatusColor = (remessa: Remessa) => {
    const status = getStatusRemessa(remessa);
    if (status === 'Esgotada') return '#F44336';
    if (status === 'Nova') return '#4CAF50';
    return '#FF9800';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" style={styles.loading} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {remessas.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>Nenhuma remessa cadastrada</Text>
              <Text style={styles.emptySubtext}>Crie sua primeira remessa para começar a vender</Text>
            </Card.Content>
          </Card>
        ) : (
          remessas.map((remessa) => (
            <Card key={remessa.id} style={styles.remessaCard}>
              <Card.Content>
                <View style={styles.remessaHeader}>
                  <View style={styles.remessaInfo}>
                    <Text style={styles.remessaData}>
                      {format(parseISO(remessa.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </Text>
                    {remessa.observacao && (
                      <Text style={styles.remessaObs}>{remessa.observacao}</Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(remessa) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(remessa) }]}>
                      {getStatusRemessa(remessa)}
                    </Text>
                  </View>
                </View>
                
                {remessa.produtos && remessa.produtos.length > 0 && (
                  <View style={styles.produtosContainer}>
                    <Text style={styles.produtosTitle}>Produtos:</Text>
                    {remessa.produtos.map((produto) => (
                      <View key={produto.id} style={styles.produtoItem}>
                        <Text style={styles.produtoNome}>
                          {produto.tipo} - {produto.sabor}
                        </Text>
                        <Text style={styles.produtoQuantidade}>
                          {produto.quantidade_inicial - produto.quantidade_vendida}/{produto.quantidade_inicial}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.actions}>
                  <Button 
                    mode="text" 
                    onPress={() => router.push(`/remessas/${remessa.id}` as any)}
                    compact
                  >
                    Ver Detalhes
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => router.push('/remessas/nova')}
      />
    </View>
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
  emptyCard: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
  },
  remessaCard: {
    marginBottom: 12,
  },
  remessaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  remessaInfo: {
    flex: 1,
  },
  remessaData: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  remessaObs: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  produtosContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  produtosTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  produtoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  produtoNome: {
    fontSize: 14,
  },
  produtoQuantidade: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});