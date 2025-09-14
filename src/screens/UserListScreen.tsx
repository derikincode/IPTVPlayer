// src/screens/UserListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import UserManager from '../services/UserManager';
import XtreamAPI from '../services/XtreamAPI';
import M3UParser from '../services/M3UParser';
import StorageService from '../services/StorageService';
import LoadingSpinner from '../components/LoadingSpinner';
import { UserProfile } from '../types';
import { COLORS, SIZES, TYPOGRAPHY } from '../utils/constants';

const UserListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    type: 'xtream' as 'xtream' | 'm3u',
    host: '',
    username: '',
    password: '',
    m3uUrl: '',
  });

  useEffect(() => {
    loadUserProfiles();
  }, []);

  const loadUserProfiles = async () => {
    setLoading(true);
    try {
      await UserManager.migrateOldData();
      const userProfiles = await UserManager.getUserProfiles();
      const activeUser = await UserManager.getActiveUser();
      
      setProfiles(userProfiles);
      setActiveUserId(activeUser?.id || null);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (profile: UserProfile) => {
    if (profile.id === activeUserId) return;

    try {
      setLoading(true);
      
      // Definir como usuário ativo
      await UserManager.setActiveUser(profile.id);
      
      // Salvar credenciais no sistema antigo para compatibilidade
      if (profile.type === 'xtream') {
        await StorageService.saveXtreamCredentials(profile.credentials as any);
      } else {
        await StorageService.saveM3UCredentials(profile.credentials as any);
      }

      Alert.alert(
        'Usuário Alterado',
        `Agora você está conectado como: ${profile.name}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao trocar usuário:', error);
      Alert.alert('Erro', 'Falha ao trocar de usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (profile: UserProfile) => {
    Alert.alert(
      'Excluir Usuário',
      `Deseja excluir o usuário "${profile.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserManager.deleteUserProfile(profile.id);
              await loadUserProfiles();
              
              // Se foi o usuário ativo que foi deletado
              if (profile.id === activeUserId) {
                setActiveUserId(null);
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir usuário');
            }
          },
        },
      ]
    );
  };

  const validateAndCreateUser = async () => {
    const { name, type, host, username, password, m3uUrl } = newUserForm;

    if (!name.trim()) {
      Alert.alert('Erro', 'Digite um nome para o usuário');
      return;
    }

    try {
      setLoading(true);
      let credentials: any;

      if (type === 'xtream') {
        if (!host || !username || !password) {
          Alert.alert('Erro', 'Preencha todos os campos Xtream');
          return;
        }

        credentials = { host: host.trim(), username: username.trim(), password };
        
        // Testar credenciais
        await XtreamAPI.authenticate(credentials);
      } else {
        if (!m3uUrl) {
          Alert.alert('Erro', 'Digite a URL da lista M3U');
          return;
        }

        credentials = { url: m3uUrl.trim() };
        
        // Testar M3U
        await M3UParser.parseM3U(credentials.url);
      }

      // Criar perfil
      const newProfile = await UserManager.createUserProfile(name.trim(), type, credentials);
      
      // Limpar formulário
      setNewUserForm({
        name: '',
        type: 'xtream',
        host: '',
        username: '',
        password: '',
        m3uUrl: '',
      });
      
      setShowAddModal(false);
      await loadUserProfiles();
      
      Alert.alert(
        'Usuário Adicionado',
        `${name} foi adicionado com sucesso!`,
        [
          { text: 'OK' },
          {
            text: 'Conectar Agora',
            onPress: () => handleSwitchUser(newProfile),
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      Alert.alert('Erro', 'Falha ao validar as credenciais. Verifique os dados inseridos.');
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const isActive = item.id === activeUserId;
    const lastUsedDate = new Date(item.lastUsed).toLocaleDateString('pt-BR');
    
    return (
      <TouchableOpacity
        style={[styles.userItem, isActive && styles.activeUserItem]}
        onPress={() => handleSwitchUser(item)}
        disabled={loading}
      >
        <View style={styles.userIcon}>
          <Icon
            name={item.type === 'xtream' ? 'server' : 'list'}
            size={24}
            color={isActive ? '#007AFF' : '#fff'}
          />
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, isActive && styles.activeUserName]}>
            {item.name}
          </Text>
          <Text style={styles.userType}>
            {item.type === 'xtream' ? 'Xtream Codes' : 'Lista M3U'}
          </Text>
          <Text style={styles.lastUsed}>
            Último acesso: {lastUsedDate}
          </Text>
        </View>

        {isActive && (
          <View style={styles.activeIndicator}>
            <Icon name="checkmark-circle" size={20} color="#007AFF" />
            <Text style={styles.activeText}>Ativo</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteUser(item)}
          disabled={loading}
        >
          <Icon name="trash" size={18} color="#dc3545" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderAddUserModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowAddModal(false)}
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Adicionar Usuário</Text>
        </View>

        <View style={styles.modalContent}>
          <TextInput
            style={styles.modalInput}
            placeholder="Nome do usuário"
            placeholderTextColor="#666"
            value={newUserForm.name}
            onChangeText={(text) => setNewUserForm({ ...newUserForm, name: text })}
          />

          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                newUserForm.type === 'xtream' && styles.typeOptionActive,
              ]}
              onPress={() => setNewUserForm({ ...newUserForm, type: 'xtream' })}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  newUserForm.type === 'xtream' && styles.typeOptionTextActive,
                ]}
              >
                Xtream Codes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                newUserForm.type === 'm3u' && styles.typeOptionActive,
              ]}
              onPress={() => setNewUserForm({ ...newUserForm, type: 'm3u' })}
            >
              <Text
                style={[
                  styles.typeOptionText,
                  newUserForm.type === 'm3u' && styles.typeOptionTextActive,
                ]}
              >
                Lista M3U
              </Text>
            </TouchableOpacity>
          </View>

          {newUserForm.type === 'xtream' ? (
            <>
              <TextInput
                style={styles.modalInput}
                placeholder="Host (ex: http://servidor.com:8080)"
                placeholderTextColor="#666"
                value={newUserForm.host}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, host: text })}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Usuário"
                placeholderTextColor="#666"
                value={newUserForm.username}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, username: text })}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Senha"
                placeholderTextColor="#666"
                value={newUserForm.password}
                onChangeText={(text) => setNewUserForm({ ...newUserForm, password: text })}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          ) : (
            <TextInput
              style={styles.modalInput}
              placeholder="URL da lista M3U"
              placeholderTextColor="#666"
              value={newUserForm.m3uUrl}
              onChangeText={(text) => setNewUserForm({ ...newUserForm, m3uUrl: text })}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          <TouchableOpacity
            style={styles.createButton}
            onPress={validateAndCreateUser}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Validando...' : 'Adicionar Usuário'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading && profiles.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Usuários</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {profiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="person-add" size={64} color="#666" />
          <Text style={styles.emptyTitle}>Nenhum usuário encontrado</Text>
          <Text style={styles.emptyText}>
            Adicione usuários para alternar entre diferentes contas IPTV
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="add" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.emptyButtonText}>Adicionar Primeiro Usuário</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderAddUserModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 20,
  },
  title: {
    flex: 1,
    fontSize: TYPOGRAPHY.FONT_SIZE_XXL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: SIZES.MARGIN,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 20,
  },
  listContainer: {
    padding: SIZES.PADDING,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: SIZES.BORDER_RADIUS + 4,
    padding: SIZES.PADDING,
    marginBottom: SIZES.MARGIN,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeUserItem: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#1a3a5c',
  },
  userIcon: {
    width: 50,
    height: 50,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.MARGIN,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.FONT_SIZE_LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  activeUserName: {
    color: COLORS.PRIMARY,
  },
  userType: {
    fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  lastUsed: {
    fontSize: TYPOGRAPHY.FONT_SIZE_SMALL,
    color: COLORS.TEXT_MUTED,
  },
  activeIndicator: {
    alignItems: 'center',
    marginRight: SIZES.MARGIN,
  },
  activeText: {
    fontSize: TYPOGRAPHY.FONT_SIZE_SMALL,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
    marginTop: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE_XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: SIZES.BORDER_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.PADDING,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 20,
  },
  modalTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.FONT_SIZE_XL,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: SIZES.MARGIN,
  },
  modalContent: {
    flex: 1,
    padding: SIZES.PADDING,
  },
  modalInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 15,
    marginBottom: 15,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: COLORS.SURFACE,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: SIZES.BORDER_RADIUS - 2,
  },
  typeOptionActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  typeOptionText: {
    color: COLORS.TEXT_MUTED,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_MEDIUM,
  },
  typeOptionTextActive: {
    color: COLORS.TEXT_PRIMARY,
  },
  createButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: SIZES.BORDER_RADIUS,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.FONT_SIZE_MEDIUM,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
  },
});

export default UserListScreen;