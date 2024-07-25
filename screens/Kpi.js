import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Collapsible from 'react-native-collapsible';
import axios from 'axios';
import { VendedorContext } from '../VendedorContext'; // Asegúrate de que la ruta sea correcta

export const Kpi = () => {
  const { vendedor } = useContext(VendedorContext);
  const [collapsed, setCollapsed] = useState(true);
  const [nombreVendedor, setNombreVendedor] = useState('');

  const fetchVendedorNombre = async () => {
    try {
      const response = await axios.get(`http://201.192.136.158:3001/nombrexID?cdpersona=${vendedor}`);
      if (response.data && response.data.length > 0) {
        setNombreVendedor(response.data[0].NOMBRE);
      }
    } catch (error) {
      console.error('Error fetching vendedor nombre:', error);
    }
  };

  useEffect(() => {
    fetchVendedorNombre();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.vendedorText}>Vendedor: {nombreVendedor}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  vendedorText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  header: {
    backgroundColor: '#f1f1f1',
    padding: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 10,
    backgroundColor: '#e1e1e1',
  },
});
