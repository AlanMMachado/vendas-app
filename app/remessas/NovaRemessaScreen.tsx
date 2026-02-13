import Header from '@/components/Header';
import { COLORS } from '@/constants/Colors';
import { ProdutoConfigService } from '@/service/produtoConfigService';
import { RemessaService } from '@/service/remessaService';
import { ProdutoConfig } from '@/types/ProdutoConfig';
import { ProdutoRemessaForm } from '@/types/Remessa';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';

export default function NovaRemessaScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [produtosConfig, setProdutosConfig] = useState<ProdutoConfig[]>([]);
  const [produtos, setProdutos] = useState<ProdutoRemessaForm[]>([]);

  useEffect(() => {
    loadProdutosConfig();
  }, []);

  const loadProdutosConfig = async () => {
    try {
      const configs = await ProdutoConfigService.getAll();
      setProdutosConfig(configs);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const adicionarProduto = (produtoConfig: ProdutoConfig) => {
    const novoProduto: ProdutoRemessaForm = {
      produtoConfigId: produtoConfig.id,
      tipo: produtoConfig.tipo,
      tipo_customizado: produtoConfig.tipo_customizado,
      sabor: '',
      quantidade_inicial: '',
      preco_base: produtoConfig.preco_base,
      preco_promocao: produtoConfig.preco_promocao,
      quantidade_promocao: produtoConfig.quantidade_promocao
    };

    setProdutos([...produtos, novoProduto]);
  };

  const removerProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index));
  };

  const atualizarProduto = (index: number, campo: keyof ProdutoRemessaForm, valor: string) => {
    const novosProdutos = [...produtos];
    (novosProdutos[index] as any)[campo] = valor;
    setProdutos(novosProdutos);
  };

  const handleSubmit = async () => {
    const produtosValidos = produtos.filter(p => {
      const quantidadeValida = p.quantidade_inicial.trim() && !isNaN(parseInt(p.quantidade_inicial)) && parseInt(p.quantidade_inicial) > 0;
      return p.sabor.trim() && quantidadeValida;
    });

    if (produtosValidos.length === 0) {
      alert('Adicione pelo menos um produto válido com sabor e quantidade.');
      return;
    }

    try {
      setSaving(true);

      const remessaData = {
        data: new Date().toISOString(),
        observacao: observacao.trim() || undefined,
        produtos: produtosValidos.map(p => {
          const tipoFinal = p.tipo === 'outro' && p.tipo_customizado
            ? p.tipo_customizado.charAt(0).toUpperCase() + p.tipo_customizado.slice(1).toLowerCase()
            : p.tipo;

          return {
            tipo: tipoFinal,
            sabor: p.sabor.trim(),
            quantidade_inicial: parseInt(p.quantidade_inicial),
            preco_base: p.preco_base,
            preco_promocao: p.preco_promocao,
            quantidade_promocao: p.quantidade_promocao,
            produto_config_id: p.produtoConfigId
          };
        })
      };

      await RemessaService.create(remessaData);
      router.back();
    } catch (error) {
      console.error('Erro ao salvar remessa:', error);
      alert('Erro ao salvar remessa. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const getTipoDisplay = (produto: ProdutoRemessaForm) => {
    return produto.tipo === 'outro' && produto.tipo_customizado
      ? produto.tipo_customizado
      : produto.tipo;
  };

  return (
    <View style={styles.container}>
      <Header title="Nova Remessa" subtitle="Selecione produtos e defina quantidades" />

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          {/* Seleção de Produtos Configurados */}
          <Text style={styles.sectionTitle}>Produtos Disponíveis</Text>
          <Text style={styles.sectionSubtitle}>Selecione os produtos para adicionar à remessa</Text>

          {produtosConfig.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum produto configurado.</Text>
              <Text style={styles.emptySubtext}>
                Vá para Configurações → Produtos para configurar seus produtos primeiro.
              </Text>
            </View>
          ) : (
            <View style={styles.produtosConfigGrid}>
              {produtosConfig.map((config) => (
                <TouchableOpacity
                  key={config.id}
                  onPress={() => adicionarProduto(config)}
                  style={styles.produtoConfigCard}
                >
                  <Text style={styles.produtoConfigTipo}>
                    {config.tipo === 'outro' ? config.tipo_customizado : config.tipo}
                  </Text>
                  <Text style={styles.produtoConfigPreco}>
                    R$ {config.preco_base.toFixed(2)}
                  </Text>
                  {config.preco_promocao && (
                    <Text style={styles.produtoConfigPromocao}>
                      Promo: R$ {config.preco_promocao.toFixed(2)} ({config.quantidade_promocao}+)
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Produtos Selecionados */}
        {produtos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.produtosHeader}>
              <Text style={styles.sectionTitle}>Produtos na Remessa</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{produtos.length}</Text>
              </View>
            </View>

            {produtos.map((produto, index) => (
              <View key={index} style={styles.produtoCard}>
                {produtos.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removerProduto(index)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.produtoInfo}>
                  <Text style={styles.produtoTipo}>{getTipoDisplay(produto)}</Text>
                  <Text style={styles.produtoPrecos}>
                    R$ {produto.preco_base.toFixed(2)}
                    {produto.preco_promocao && ` → R$ ${produto.preco_promocao.toFixed(2)} (${produto.quantidade_promocao}+)`}
                  </Text>
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
                  <Text style={styles.label}>Quantidade *</Text>
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
          </View>
        )}

        {/* Observação */}
        <View style={styles.section}>
          <View style={styles.observacaoHeader}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.sectionSubtitle}>Adicione notas sobre a remessa</Text>
          </View>
          <TextInput
            value={observacao}
            onChangeText={setObservacao}
            style={styles.observacaoInput}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Ex: Remessa da segunda-feira, congelar antes de enviar..."
            outlineColor={COLORS.borderGray}
            activeOutlineColor={COLORS.mediumBlue}
            placeholderTextColor={COLORS.textLight}
          />
          <Text style={styles.charCount}>
            {observacao.length}/200 caracteres
          </Text>
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
              <Text style={styles.submitButtonText}>Criar Remessa</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textMedium,
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderGray,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMedium,
    textAlign: 'center',
  },
  produtosConfigGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  produtoConfigCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderGray,
    padding: 16,
    alignItems: 'center',
  },
  produtoConfigTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  produtoConfigPreco: {
    fontSize: 14,
    color: COLORS.textMedium,
    marginBottom: 4,
  },
  produtoConfigPromocao: {
    fontSize: 12,
    color: COLORS.green,
  },
  produtosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: COLORS.softGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderGray,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.mediumBlue,
  },
  produtoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderGray,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.softGray,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: COLORS.textMedium,
    fontSize: 24,
    fontWeight: '300',
  },
  produtoInfo: {
    marginBottom: 16,
  },
  produtoTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  produtoPrecos: {
    fontSize: 14,
    color: COLORS.textMedium,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
  },
  observacaoHeader: {
    marginBottom: 12,
  },
  observacaoInput: {
    backgroundColor: COLORS.white,
    minHeight: 100,
    paddingVertical: 12,
    paddingHorizontal: 12,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: 'right',
  },
  textArea: {
    backgroundColor: COLORS.white,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.borderGray,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textMedium,
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.mediumBlue,
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
    color: COLORS.white,
  },
});