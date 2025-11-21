import Header from '@/components/Header';
import { RemessaService } from '@/service/remessaService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';

interface ProdutoForm {
  id: number;
  tipo: string;
  tipoCustomizado: string;
  sabor: string;
  quantidade_inicial: string;
}

export default function EditarRemessaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [produtos, setProdutos] = useState<ProdutoForm[]>([]);
  const [produtosOriginais, setProdutosOriginais] = useState<ProdutoForm[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        carregarRemessa();
      }
    }, [id])
  );

  const carregarRemessa = async () => {
    try {
      setLoading(true);
      const remessa = await RemessaService.getById(parseInt(id));
      if (remessa) {
        setObservacao(remessa.observacao || '');
        const produtosMapeados = remessa.produtos?.map(p => {
          // Normalizar tipos existentes para capitalização correta
          let tipoNormalizado = p.tipo;
          if (p.tipo && p.tipo !== 'outro') {
            // Mapear tipos antigos para novos
            if (p.tipo.toLowerCase() === 'bolo') {
              tipoNormalizado = 'Torta';
            } else {
              tipoNormalizado = p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1).toLowerCase();
            }
          }
          
          return {
            id: p.id,
            tipo: tipoNormalizado,
            tipoCustomizado: '',
            sabor: p.sabor,
            quantidade_inicial: p.quantidade_inicial.toString()
          };
        }) || [];
        setProdutos(produtosMapeados);
        setProdutosOriginais(JSON.parse(JSON.stringify(produtosMapeados))); // Deep copy
      }
    } catch (error) {
      console.error('Erro ao carregar remessa:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarProduto = () => {
    setProdutos([...produtos, { 
      id: 0, // ID temporário
      tipo: '', 
      tipoCustomizado: '',
      sabor: '', 
      quantidade_inicial: '' 
    }]);
  };

  const removerProduto = (index: number) => {
    if (produtos.length > 1) {
      setProdutos(produtos.filter((_, i) => i !== index));
    }
  };

  const atualizarProduto = (index: number, campo: 'tipo' | 'tipoCustomizado' | 'sabor' | 'quantidade_inicial', valor: string) => {
    const novosProdutos = [...produtos];
    novosProdutos[index][campo] = valor;
    setProdutos(novosProdutos);
  };

  const handleSubmit = async () => {
    const produtosValidos = produtos.filter(p => {
      const tipoValido = p.tipo.trim() && (p.tipo !== 'outro' || p.tipoCustomizado.trim());
      return tipoValido && p.sabor.trim() && p.quantidade_inicial.trim() && parseInt(p.quantidade_inicial) > 0;
    });

    if (produtosValidos.length === 0) {
      alert('Adicione pelo menos um produto válido');
      return;
    }

    try {
      setSaving(true);
      
      // Update remessa
      await RemessaService.update(parseInt(id), {
        observacao: observacao.trim() || undefined
      });

      // Delete removed products
      const produtosAtuaisIds = produtosValidos.map(p => p.id).filter(id => id && id > 0);
      const produtosParaDeletar = produtosOriginais.filter(p => p.id && p.id > 0 && !produtosAtuaisIds.includes(p.id));
      
      for (const produto of produtosParaDeletar) {
        if (produto.id && produto.id > 0) {
          await RemessaService.deleteProduto(produto.id);
        }
      }

      // Update products
      for (const produto of produtosValidos) {
        const tipoFinal = produto.tipo === 'outro' && produto.tipoCustomizado.trim() 
          ? produto.tipoCustomizado.trim().charAt(0).toUpperCase() + produto.tipoCustomizado.trim().slice(1).toLowerCase()
          : produto.tipo;

        if (produto.id && produto.id > 0) {
          // Update existing product
          await RemessaService.updateProduto(produto.id, {
            tipo: tipoFinal,
            sabor: produto.sabor.trim(),
            quantidade_inicial: parseInt(produto.quantidade_inicial)
          });
        } else {
          // Add new product
          await RemessaService.addProduto(parseInt(id), {
            tipo: tipoFinal,
            sabor: produto.sabor.trim(),
            quantidade_inicial: parseInt(produto.quantidade_inicial)
          });
        }
      }

      router.back();
    } catch (error) {
      console.error('Erro ao salvar remessa:', error);
      alert('Erro ao salvar remessa. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Editar Remessa" subtitle="Atualize os dados da remessa" />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView>
          <View style={styles.content}>

        {/* Produtos */}
        <View style={styles.produtosSection}>
          <View style={styles.produtosHeader}>
            <Text style={styles.sectionTitle}>Produtos</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{produtos.length}</Text>
            </View>
          </View>

          {produtos.map((produto, index) => (
            <View key={produto.id || index} style={styles.produtoCard}>
              {produtos.length > 1 && (
                <TouchableOpacity 
                  onPress={() => removerProduto(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}

              {/* Tipo */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tipo *</Text>
                <View style={styles.tipoButtonsGrid}>
                  <TouchableOpacity
                    onPress={() => atualizarProduto(index, 'tipo', 'Trufa')}
                    style={[
                      styles.tipoButton,
                      produto.tipo === 'Trufa' && styles.tipoButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.tipoButtonText,
                      produto.tipo === 'Trufa' && styles.tipoButtonTextActive
                    ]}>
                      Trufa
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => atualizarProduto(index, 'tipo', 'Surpresa')}
                    style={[
                      styles.tipoButton,
                      produto.tipo === 'Surpresa' && styles.tipoButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.tipoButtonText,
                      produto.tipo === 'Surpresa' && styles.tipoButtonTextActive
                    ]}>
                      Surpresa
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => atualizarProduto(index, 'tipo', 'Torta')}
                    style={[
                      styles.tipoButton,
                      produto.tipo === 'Torta' && styles.tipoButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.tipoButtonText,
                      produto.tipo === 'Torta' && styles.tipoButtonTextActive
                    ]}>
                      Torta
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => atualizarProduto(index, 'tipo', 'outro')}
                    style={[
                      styles.tipoButton,
                      produto.tipo === 'outro' && styles.tipoButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.tipoButtonText,
                      produto.tipo === 'outro' && styles.tipoButtonTextActive
                    ]}>
                      Outro
                    </Text>
                  </TouchableOpacity>
                </View>

                {produto.tipo === 'outro' && (
                  <TextInput
                    value={produto.tipoCustomizado}
                    onChangeText={(text) => atualizarProduto(index, 'tipoCustomizado', text)}
                    style={styles.input}
                    mode="outlined"
                    placeholder="Digite o tipo personalizado"
                    outlineColor="#d1d5db"
                    activeOutlineColor="#2563eb"
                  />
                )}
              </View>

              {/* Sabor */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Sabor *</Text>
                <TextInput
                  value={produto.sabor}
                  onChangeText={(text) => atualizarProduto(index, 'sabor', text)}
                  style={styles.input}
                  mode="outlined"
                  placeholder="Ex: Morango, Chocolate..."
                  outlineColor="#d1d5db"
                  activeOutlineColor="#2563eb"
                />
              </View>

              {/* Quantidade */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Quantidade Inicial *</Text>
                <TextInput
                  value={produto.quantidade_inicial}
                  onChangeText={(text) => atualizarProduto(index, 'quantidade_inicial', text)}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                  placeholder="Ex: 20"
                  outlineColor="#d1d5db"
                  activeOutlineColor="#2563eb"
                />
              </View>
            </View>
          ))}

          {/* Botão Adicionar */}
          <TouchableOpacity
            onPress={adicionarProduto}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Adicionar Produto</Text>
          </TouchableOpacity>
        </View>

        {/* Observação */}
        <View style={styles.section}>
          <Text style={styles.label}>Observação (opcional)</Text>
          <TextInput
            value={observacao}
            onChangeText={setObservacao}
            style={styles.textArea}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Ex: Remessa da segunda-feira..."
            outlineColor="#d1d5db"
            activeOutlineColor="#2563eb"
          />
        </View>

        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" size={20} />
            ) : (
              <Text style={styles.submitButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
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
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#ffffff',
  },
  produtosSection: {
    marginBottom: 20,
  },
  produtosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
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
  produtoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  tipoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tipoButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  tipoButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  tipoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tipoButtonTextActive: {
    color: '#ffffff',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: '#6b7280',
    fontSize: 24,
    fontWeight: '300',
  },
  addButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});