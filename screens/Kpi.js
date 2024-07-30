import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import axios from 'axios';
import { format, getISOWeek, parseISO } from 'date-fns';
import { VendedorContext } from '../VendedorContext'; // Asegúrate de que la ruta sea correcta

export const Kpi = () => {
  const { vendedor } = useContext(VendedorContext);
  const [nombreVendedor, setNombreVendedor] = useState('');
  const [quintalesData, setQuintalesData] = useState([]);

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

  const fetchQuintalesData = async () => {
    try {
      const response = await axios.get(`http://201.192.136.158:3001/quintales-por-semana?cdvendedor=${vendedor}`);
      if (response.data) {
        setQuintalesData(response.data);
      }
    } catch (error) {
      console.error('Error fetching quintales data:', error);
    }
  };

  useEffect(() => {
    fetchVendedorNombre();
    fetchQuintalesData();
  }, [vendedor]);

  const renderItem = ({ item, index }) => {
    const weekNumber = getISOWeek(parseISO(item.SEMANA));
    const formattedDate = format(parseISO(item.SEMANA), 'dd-MM-yyyy');
    return (
      <View style={styles.row}>
        <Text style={styles.cell}>{`Semana ${weekNumber} ${formattedDate}`}</Text>
        <Text style={styles.cell}>{item.TOTAL_QUINTALES}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ventas QQ por semana</Text>
      <Text style={styles.vendedorText}>Vendedor: {nombreVendedor}</Text>
      <View style={styles.table}>
        <View style={styles.rowHeader}>
          <Text style={styles.headerCell}>Semana</Text>
          <Text style={styles.headerCell}>Total Quintales</Text>
        </View>
        <FlatList
          data={quintalesData}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay datos disponibles</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  vendedorText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  rowHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    padding: 10,
  },
  headerCell: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cell: {
    flex: 1,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
});
