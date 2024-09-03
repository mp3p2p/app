import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Text, Dimensions, Platform } from 'react-native';
import { Card, Button, TextInput } from 'react-native-paper';
import axios from 'axios';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import Feather from 'react-native-vector-icons/Feather';
import debounce from 'lodash.debounce';
import { VendedorContext } from '../VendedorContext'; // Asegúrate de que la ruta sea correcta
import { BASE_URL } from './config';

Feather.loadFont();

export const Pedidos = () => {
  const { vendedor } = useContext(VendedorContext);
  const [expandedCliente, setExpandedCliente] = useState(null);
  const [data, setData] = useState([]);
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nombreVendedor, setNombreVendedor] = useState('');
  const dropdownController = useRef(null);

  const fetchVendedorNombre = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/nombrexID?cdpersona=${vendedor}`);
      if (response.data && response.data.length > 0) {
        setNombreVendedor(response.data[0].NOMBRE);
      }
    } catch (error) {
      console.error('Error fetching vendedor nombre:', error);
    }
  };

  const fetchData = () => {
    axios.get(`${BASE_URL}/products?cdvendedor=${vendedor}`)
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  useEffect(() => {
    fetchVendedorNombre();
    fetchData();
  }, []);

  const toggleCollapse = (cliente) => {
    setExpandedCliente(prev => (prev === cliente ? null : cliente));
  };

  const increaseQuantity = (cliente, index) => {
    setData(prevData => {
      const updatedData = [...prevData];
      const clienteData = updatedData.find(item => item.cliente === cliente);
      clienteData.products[index].quantity += 1;
      return updatedData;
    });
  };

  const decreaseQuantity = (cliente, index) => {
    setData(prevData => {
      const updatedData = [...prevData];
      const clienteData = updatedData.find(item => item.cliente === cliente);
      clienteData.products[index].quantity -= 1;
      return updatedData;
    });
  };

  const deleteProduct = (cliente, index) => {
    setData(prevData => {
      const updatedData = [...prevData];
      const clienteData = updatedData.find(item => item.cliente === cliente);
      clienteData.products.splice(index, 1);
      return updatedData;
    });
  };

  const addProduct = (cliente) => {
    setData(prevData => {
      const updatedData = [...prevData];
      const clienteData = updatedData.find(item => item.cliente === cliente);
      clienteData.products.push({ quantity: 0, description: '', isNew: true });
      return updatedData;
    });
  };

  const sendData = (cliente) => {
    const clienteData = data.find(item => item.cliente === cliente);
    axios.post('http://201.192.136.158:3001/submit', { clienteData })
      .then(response => {
        console.log('Datos enviados exitosamente:', response.data);
      })
      .catch(error => {
        console.error('Error enviando los datos:', error);
      });
  };

  const getSuggestions = useCallback(debounce(async (q) => {
    const filterToken = q.toLowerCase();
    if (typeof q !== 'string' || q.length < 2) {
      setSuggestionsList([]);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get('${BASE_URL}/productos');
      console.log(response.data); // Depuración: Verifica la estructura de la respuesta
      const items = response.data;
      if (!Array.isArray(items)) {
        throw new Error('La respuesta de la API no es un array');
      }
      const suggestions = items
        .filter((item) => item.nbproducto.toLowerCase().includes(filterToken))
        .map((item) => ({
          id: item.cdventa,
          title: item.nbproducto
        }));
      setSuggestionsList(suggestions);
    } catch (error) {
      console.error('Error al obtener la lista de productos:', error);
    } finally {
      setLoading(false);
    }
  }, 600), []);

  const renderItem = ({ item }) => (
    <Card elevation={3} style={styles.card}>
      <Card.Content>
        <Button onPress={() => toggleCollapse(item.cliente)} mode="contained" buttonColor="#427a5b">
          {item.cliente} {expandedCliente === item.cliente ? 'colapsar' : 'expandir'}
        </Button>
        {expandedCliente === item.cliente && (
          <View>
            {item.products.map((product, index) => (
              <View key={index} style={styles.productContainer}>
                {product.isNew ? (
                  <AutocompleteDropdown
                    controller={(controller) => {
                      dropdownController.current = controller;
                    }}
                    direction={Platform.select({ ios: 'down' })}
                    dataSet={suggestionsList}
                    onChangeText={getSuggestions}
                    onSelectItem={(selectedItem) => {
                      if (selectedItem) {
                        const newData = [...data];
                        const clienteData = newData.find(clienteItem => clienteItem.cliente === item.cliente);
                        clienteData.products[index].description = selectedItem.title;
                        setData(newData);
                      }
                    }}
                    debounce={600}
                    suggestionsListMaxHeight={Dimensions.get('window').height * 0.4}
                    onClear={() => setSuggestionsList([])}
                    loading={loading}
                    useFilter={false}
                    textInputProps={{
                      placeholder: 'Buscar Productos',
                      autoCorrect: false,
                      autoCapitalize: 'none',
                      placeholderTextColor: '#000',
                    }}
                    rightButtonsContainerStyle={{
                      right: 8,
                      height: 30,
                      alignSelf: 'center',
                    }}
                    inputContainerStyle={{}}
                    suggestionsListContainerStyle={{}}
                    containerStyle={{ flexGrow: 1, flexShrink: 1 }}
                    renderItem={(item, text) => (
                      <Text style={{ padding: 8, fontSize: 10 }}>{item.title}</Text>
                    )}
                    ChevronIconComponent={
                      <Feather name="chevron-down" size={20} color="#000000" />
                    }
                    ClearIconComponent={
                      <Feather name="x-circle" size={18} color="#000000" />
                    }
                    inputHeight={50}
                    showChevron={false}
                    closeOnBlur={false}
                  />
                ) : (
                  <TextInput
                    style={styles.input}
                    value={product.description}
                    onChangeText={text => {
                      const newData = [...data];
                      const clienteData = newData.find(clienteItem => clienteItem.cliente === item.cliente);
                      clienteData.products[index].description = text;
                      setData(newData);
                    }}
                    label="Descripción"
                  />
                )}
                <View style={styles.quantityContainer}>
                  <Button onPress={() => decreaseQuantity(item.cliente, index)} mode="contained" style={styles.smallButton} buttonColor="#03dac6">
                    -
                  </Button>
                  <TextInput
                    style={styles.inputQuantity}
                    value={String(product.quantity)}
                    onChangeText={text => {
                      const newData = [...data];
                      const clienteData = newData.find(clienteItem => clienteItem.cliente === item.cliente);
                      clienteData.products[index].quantity = parseInt(text) || 0;
                      setData(newData);
                    }}
                    label="Cantidad"
                    keyboardType="numeric"
                  />
                  <Button onPress={() => increaseQuantity(item.cliente, index)} mode="contained" style={styles.smallButton} buttonColor="#03dac6">
                    +
                  </Button>
                  <Button onPress={() => deleteProduct(item.cliente, index)} mode="contained" style={styles.smallButton} buttonColor="#b00020">
                    Eliminar
                  </Button>
                </View>
              </View>
            ))}
            <Button onPress={() => addProduct(item.cliente)} mode="contained" style={styles.addButton} buttonColor="#6200ee">
              Añadir Producto
            </Button>
            <Button onPress={() => sendData(item.cliente)} mode="contained" style={styles.sendButton} buttonColor="#6200ee">
              Enviar Datos
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.vendedorText}>Vendedor: {nombreVendedor}</Text>
      <Button onPress={fetchData} mode="contained" style={styles.reloadButton} buttonColor="#427a5b">
        Recargar Datos
      </Button>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.cliente}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 15,
    backgroundColor: '#ffffff', // Fondo blanco
    flex: 1,
  },
  vendedorText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    marginBottom: 4,
    backgroundColor:'#ffffff',
  },
  input: {
    marginBottom: 10,
    fontSize: 14,
  },
  inputQuantity: {
    marginBottom: 10,
    width: 60,
    fontSize: 16,
    textAlign: 'center',
  },
  productContainer: {
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  smallButton: {
    minWidth: 30,
    minHeight: 30,
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  addButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  reloadButton: {
    marginBottom: 10,
  },
  sendButton: {
    marginVertical: 10,
    alignSelf: 'center',
  },
});
