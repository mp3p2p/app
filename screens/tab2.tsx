import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { Card, Button, TextInput } from 'react-native-paper';
import axios from 'axios';
import { VendedorContext } from '../VendedorContext'; // Asegúrate de que la ruta sea correcta

export const Pedidos = () => {
  const { vendedor } = useContext(VendedorContext);
  const [expandedCliente, setExpandedCliente] = useState(null);
  const [data, setData] = useState([]);

  const fetchData = () => {
    axios.get('http://201.192.136.158:3001/products?cdvendedor=7134')
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  useEffect(() => {
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
      clienteData.products.push({ quantity: 0, description: '' });
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
      <Text style={styles.vendedorText}>Vendedor: {vendedor}</Text>
      <Button onPress={fetchData} mode="contained" style={styles.reloadButton} buttonColor="#6200ee">
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
    margin: 10,
    backgroundColor: '#ffffff', // Fondo blanco
    flex: 1,
  },
  vendedorText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    marginBottom: 10,
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

export default Pedidos;
