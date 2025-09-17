// src/components/SearchBar.tsx - COM ÍCONES REACT NATIVE
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChangeText?: (query: string) => void;
  loading?: boolean;
  value?: string;
  autoFocus?: boolean;
  showButton?: boolean;
  compact?: boolean;
  style?: any;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Buscar...',
  onSearch,
  onChangeText,
  loading = false,
  value: externalValue,
  autoFocus = false,
  showButton = false,
  compact = false,
  style,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const query = externalValue !== undefined ? externalValue : internalValue;

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleChangeText = (text: string) => {
    if (externalValue === undefined) {
      setInternalValue(text);
    }
    onChangeText?.(text);
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query.trim());
    }
  };

  const handleClear = () => {
    if (externalValue === undefined) {
      setInternalValue('');
    }
    onChangeText?.('');
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <Animated.View 
        style={[
          styles.inputContainer,
          compact && styles.compactInputContainer,
          isFocused && styles.inputContainerFocused,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Icon 
          name="search" 
          size={compact ? 16 : 18} 
          color="#666" 
          style={styles.searchIcon} 
        />
        <TextInput
          ref={inputRef}
          style={[styles.input, compact && styles.compactInput]}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={query}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Icon 
              name="close-circle" 
              size={compact ? 16 : 18} 
              color="#666" 
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {showButton && query.length > 0 && (
        <TouchableOpacity
          style={[
            styles.searchButton,
            loading && styles.searchButtonDisabled,
            compact && styles.compactSearchButton,
          ]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <Icon 
              name="hourglass" 
              size={compact ? 14 : 16} 
              color="#fff" 
              style={styles.buttonIcon}
            />
          ) : (
            <Icon 
              name="search" 
              size={compact ? 14 : 16} 
              color="#fff" 
              style={styles.buttonIcon}
            />
          )}
          <Text style={[styles.searchButtonText, compact && styles.compactSearchButtonText]}>
            {loading ? 'Buscando...' : 'Buscar'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactContainer: {
    marginBottom: 0,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  compactInputContainer: {
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
    backgroundColor: '#333',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 0,
  },
  compactInput: {
    fontSize: 14,
  },
  clearButton: {
    padding: 8,
    marginRight: -4,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  compactSearchButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    height: 42,
    borderRadius: 8,
    marginLeft: 8,
  },
  searchButtonDisabled: {
    backgroundColor: '#555',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  compactSearchButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  buttonIcon: {
    marginRight: 2,
  },
});

export default SearchBar;