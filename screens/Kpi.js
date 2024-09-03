import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import axios from 'axios';
import { format, getISOWeek, parseISO } from 'date-fns';
import { VendedorContext } from '../VendedorContext';
import { BASE_URL } from './config';
export const Kpi = () => {
  const { vendedor } = useContext(VendedorContext);
  const [nombreVendedor, setNombreVendedor] = useState('');
  const [quintalesData, setQuintalesData] = useState([]);
  const [kpiData, setKpiData] = useState([]);

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

  const fetchQuintalesData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/quintales-por-semana?cdvendedor=${vendedor}`);
      if (response.data) {
        setQuintalesData(response.data);
      }
    } catch (error) {
      console.error('Error fetching quintales data:', error);
    }
  };

  const fetchKpiData = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/kpixmes`, {
        params: { cdvendedor: vendedor }
      });
      if (response.data) {
        setKpiData(response.data);
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  useEffect(() => {
    fetchVendedorNombre();
    fetchQuintalesData();
    fetchKpiData();
  }, [vendedor]);

  const renderQuintalesItem = ({ item, index }) => {
    const weekNumber = getISOWeek(parseISO(item.SEMANA));
    const formattedDate = format(parseISO(item.SEMANA), 'dd-MM-yyyy');
    const rowStyle = index % 2 === 0 ? styles.rowEven : styles.rowOdd;
    const formattedQuintales = parseFloat(item.TOTAL_QUINTALES).toFixed(2);
    return (
      <View style={[styles.row, rowStyle]}>
        <Text style={styles.cell}>{`Semana ${weekNumber} ${formattedDate}`}</Text>
        <Text style={styles.cell}>{formattedQuintales}</Text>
      </View>
    );
  };

  const renderKpiItem = ({ item, index }) => {
    const formattedMonth = format(parseISO(item.MES), 'MM');
    const rowStyle = index % 2 === 0 ? styles.rowEven : styles.rowOdd;
    const formattedQuintales = parseFloat(item.TOTAL_QUINTALES).toFixed(2);
    return (
      <View style={[styles.row, rowStyle]}>
        <Text style={styles.cell}>{item.CDFAMILIA}</Text>
        <Text style={styles.cell}>{item.NBFAMILIA}</Text>
        <Text style={styles.cell}>{formattedMonth}</Text>
        <Text style={styles.cell}>{formattedQuintales}</Text>
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
          renderItem={renderQuintalesItem}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay datos disponibles</Text>}
        />
      </View>
      <Text style={styles.title}>KPI por Mes</Text>
      <View style={styles.table}>
        <View style={styles.rowHeader}>
          <Text style={styles.headerCell}>Familia</Text>
          <Text style={styles.headerCell}>Nombre Familia</Text>
          <Text style={styles.headerCell}>Mes</Text>
          <Text style={styles.headerCell}>Total Quintales</Text>
        </View>
        <FlatList
          data={kpiData}
          renderItem={renderKpiItem}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay datos disponibles</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    marginBottom: 20,
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
  rowEven: {
    backgroundColor: '#f9f9f9',
  },
  rowOdd: {
    backgroundColor: '#ffffff',
  },
  headerCell: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 5,
    paddingHorizontal: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
});

export default Kpi;
