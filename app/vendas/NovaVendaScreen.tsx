import Header from '@/components/Header';
import { useApp } from '@/contexts/AppContext';
import { RemessaService } from '@/service/remessaService';
import { VendaService } from '@/service/vendaService';
import { Produto } from '@/types/Remessa';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Switch, Text, TextInput } from 'react-native-paper';

export default function NovaVendaScreen() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [formData, setFormData] = useState({
    produto_id: '',
    cliente: '',
    quantidade_vendida: '1',
    preco: '',
    status: 'OK' as 'OK' | 'PENDENTE',
    metodo_pagamento: 'PIX'
  });

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const remessasAtivas = await RemessaService.getAtivas();
      const todosProdutos: Produto[] = [];
      
      for (const remessa of remessasAtivas) {
        const produtosRemessa = await RemessaService.getProdutosByRemessaId(remessa.id);
        const produtosDisponiveis = produtosRemessa.filter(p => 
          p.quantidade_inicial - p.quantidade_vendida > 0
        );
        todosProdutos.push(...produtosDisponiveis);
      }
      
      setProdutos(todosProdutos);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.produto_id || !formData.preco || !formData.cliente) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if(!formData.metodo_pagamento || formData.metodo_pagamento.trim() === ""){
      alert("Selecione um método de pagamento.")
      return;
    }

    try {
      setSaving(true);
      const venda = await VendaService.create({
        produto_id: parseInt(formData.produto_id),
        cliente: formData.cliente,
        quantidade_vendida: parseInt(formData.quantidade_vendida),
        preco: parseFloat(formData.preco) * parseInt(formData.quantidade_vendida),
        data: new Date().toISOString().split('T')[0],
        status: formData.status,
        metodo_pagamento: formData.metodo_pagamento || undefined
      });

      dispatch({ type: 'ADD_VENDA', payload: venda });
      router.back();
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      alert('Erro ao salvar venda. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (produtos.length === 0) {
    return (
      <View style={styles.container}>
        <Header title="Nova Venda" subtitle="Registre uma venda rapidamente" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>Nenhum produto disponível</Text>
          <Text style={styles.emptySubtext}>Crie uma remessa com produtos primeiro</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/remessas/nova')}
          >
            <Text style={styles.emptyButtonText}>+ Criar Remessa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Nova Venda" subtitle="Registre uma venda rapidamente" />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView>
          <View style={styles.content}>

        {/* Produto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produto *</Text>
          <Text style={styles.sectionSubtitle}>Selecione o produto vendido</Text>
          
          <View style={styles.produtosGrid}>
            {produtos.map((produto) => (
              <TouchableOpacity
                key={produto.id}
                onPress={() => setFormData({ ...formData, produto_id: produto.id.toString() })}
                style={[
                  styles.produtoChip,
                  formData.produto_id === produto.id.toString() && styles.produtoChipActive
                ]}
              >
                <Text style={[
                  styles.produtoChipText,
                  formData.produto_id === produto.id.toString() && styles.produtoChipTextActive
                ]}>
                  {produto.tipo} - {produto.sabor}
                </Text>
                <Text style={[
                  styles.produtoChipStock,
                  formData.produto_id === produto.id.toString() && styles.produtoChipStockActive
                ]}>
                  {produto.quantidade_inicial - produto.quantidade_vendida} disp.
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informações */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Venda</Text>
          
          {/* Cliente */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cliente *</Text>
            <TextInput
              value={formData.cliente}
              onChangeText={(text) => setFormData({ ...formData, cliente: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Nome do cliente"
              outlineColor="#d1d5db"
              activeOutlineColor="#2563eb"
            />
          </View>

          {/* Quantidade e Preço */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Quantidade *</Text>
              <TextInput
                value={formData.quantidade_vendida}
                onChangeText={(text) => setFormData({ ...formData, quantidade_vendida: text })}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                placeholder="1"
                outlineColor="#d1d5db"
                activeOutlineColor="#2563eb"
              />
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.label}>Preço (R$) *</Text>
              <TextInput
                value={formData.preco}
                onChangeText={(text) => setFormData({ ...formData, preco: text })}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                placeholder="0.00"
                outlineColor="#d1d5db"
                activeOutlineColor="#2563eb"
              />
            </View>
          </View>

          {/* Método de Pagamento */}
          <Text style={styles.label}>Método de Pagamento *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.metodo_pagamento}
              onValueChange={(itemValue) =>
                setFormData({ ...formData, metodo_pagamento: itemValue })
              }
              style={styles.picker}
            >
              <Picker.Item label="Pix" value="Pix" />
              <Picker.Item label="Dinheiro" value="Dinheiro" />
              <Picker.Item label="Cartão Débito" value="Cartão Débito" />
              <Picker.Item label="Cartão Crédito" value="Cartão Crédito" />
            </Picker>
          </View>
          </View>

        {/* Status de Pagamento */}
        <View style={styles.statusSection}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.sectionTitle}>Status de Pagamento</Text>
              <Text style={styles.statusSubtitle}>
                {formData.status === 'OK' ? 'Pagamento recebido' : 'Aguardando pagamento'}
              </Text>
            </View>
            <Switch
              value={formData.status === 'OK'}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                status: value ? 'OK' : 'PENDENTE' 
              })}
              color="#2563eb"
            />
          </View>

          <View style={styles.statusOptions}>
            <TouchableOpacity
              onPress={() => setFormData({ ...formData, status: 'OK' })}
              style={[
                styles.statusOption,
                formData.status === 'OK' && styles.statusOptionActive
              ]}
            >
              <Text style={[
                styles.statusOptionText,
                formData.status === 'OK' && styles.statusOptionTextActive
              ]}>
                Pago
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFormData({ ...formData, status: 'PENDENTE' })}
              style={[
                styles.statusOption,
                formData.status === 'PENDENTE' && styles.statusOptionActive
              ]}
            >
              <Text style={[
                styles.statusOptionText,
                formData.status === 'PENDENTE' && styles.statusOptionTextActive
              ]}>
                Pendente
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumo */}
        {formData.preco && formData.quantidade_vendida && formData.produto_id && (
          <View style={styles.resumoCard}>
            <Text style={styles.resumoTitle}>Resumo</Text>
            <View style={styles.resumoItem}>
              <Text style={styles.resumoLabel}>Valor Total:</Text>
              <Text style={styles.resumoValue}>
                R$ {(parseFloat(formData.preco) * parseInt(formData.quantidade_vendida || '1')).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

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
              <Text style={styles.submitButtonText}>Confirmar Venda</Text>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  header: {
    marginBottom: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  },
  produtosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  produtoChip: {
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  produtoChipActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  produtoChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  produtoChipTextActive: {
    color: '#ffffff',
  },
  produtoChipStock: {
    fontSize: 11,
    color: '#9ca3af',
  },
  produtoChipStockActive: {
    color: '#dbeafe',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  statusSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    padding: 20,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  statusOptionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  statusOptionTextActive: {
    color: '#2563eb',
  },
  resumoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    padding: 20,
    marginBottom: 16,
  },
  resumoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
  },
  resumoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  resumoValue: {
    fontSize: 20,
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    overflow: 'hidden'
  },
  picker: {
    height: 50,
    width: '100%',
  }

});