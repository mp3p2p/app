import React, { useState } from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import axios from 'axios';

export const Descuentos = () => {
  const [cdpersonaDescuentos, setCdpersonaDescuentos] = useState('');
  const [cdpersonaCalidad, setCdpersonaCalidad] = useState('');
  const [descuentosData, setDescuentosData] = useState([]);
  const [calidadData, setCalidadData] = useState([]);

  const fetchDescuentosData = async () => {
    try {
      const response = await axios.get(`http://201.192.136.158:3001/descuentos?cdpersona=${cdpersonaDescuentos}`);
      if (response.data) {
        setDescuentosData(response.data);
      }
    } catch (error) {
      console.error('Error fetching descuentos data:', error);
    }
  };

  const fetchCalidadData = async () => {
    try {
      const response = await axios.get(`http://201.192.136.158:3001/calidad?cdpersona=${cdpersonaCalidad}`);
      if (response.data) {
        setCalidadData(response.data);
      }
    } catch (error) {
      console.error('Error fetching calidad data:', error);
    }
  };

  const renderDescuentoItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.CDPERSONA}</Text>
      <Text style={styles.cell}>{item.TIPOPRECIOREG}</Text>
      <Text style={styles.cell}>{item.CDFAMILIA}</Text>
      <Text style={styles.cell}>{item.NBFAMILIA}</Text>
      <Text style={styles.cell}>{item.TIPOPRECIOLIB}</Text>
      <Text style={styles.cell}>{item.DESCREG}</Text>
      <Text style={styles.cell}>{item.DESCLIB}</Text>
      <Text style={styles.cell}>{item.DESCCONTREG}</Text>
      <Text style={styles.cell}>{item.DESCCONTLIB}</Text>
      <Text style={styles.cell}>{item.FCINI}</Text>
      <Text style={styles.cell}>{item.FCFIN}</Text>
    </View>
  );

  const renderCalidadItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.cell}>{item.CDPERSONA}</Text>
      <Text style={styles.cell}>{item.CDCALIDAD}</Text>
      <Text style={styles.cell}>{item.FCINI}</Text>
      <Text style={styles.cell}>{item.FCFIN}</Text>
      <Text style={styles.cell}>{item.PORCDESCCRED}</Text>
      <Text style={styles.cell}>{item.PORCDESCCONT}</Text>
      <Text style={styles.cell}>{item.TIPOPRECIO}</Text>
      <Text style={styles.cell}>{item.PRECIOKILO}</Text>
    </View>
  );

  const sections = [
    {
      title: 'Consulta de Descuentos',
      data: descuentosData,
      keyExtractor: (item, index) => `descuento-${index}`,
      renderItem: renderDescuentoItem,
      header: (
        <View>
          <TextInput
            label="Código de Persona para Descuentos"
            value={cdpersonaDescuentos}
            onChangeText={text => setCdpersonaDescuentos(text)}
            style={styles.input}
          />
          <Button mode="contained" onPress={fetchDescuentosData} style={styles.button}>
            Consultar Descuentos
          </Button>
          <View style={styles.rowHeader}>
            <Text style={styles.headerCell}>CD Persona</Text>
            <Text style={styles.headerCell}>Tipo Precio Reg</Text>
            <Text style={styles.headerCell}>CD Familia</Text>
            <Text style={styles.headerCell}>NB Familia</Text>
            <Text style={styles.headerCell}>Tipo Precio Lib</Text>
            <Text style={styles.headerCell}>Desc Reg</Text>
            <Text style={styles.headerCell}>Desc Lib</Text>
            <Text style={styles.headerCell}>Desc Cont Reg</Text>
            <Text style={styles.headerCell}>Desc Cont Lib</Text>
            <Text style={styles.headerCell}>Fecha Ini</Text>
            <Text style={styles.headerCell}>Fecha Fin</Text>
          </View>
        </View>
      ),
    },
    {
      title: 'Consulta de Calidad',
      data: calidadData,
      keyExtractor: (item, index) => `calidad-${index}`,
      renderItem: renderCalidadItem,
      header: (
        <View>
          <TextInput
            label="Código de Persona para Calidad"
            value={cdpersonaCalidad}
            onChangeText={text => setCdpersonaCalidad(text)}
            style={styles.input}
          />
          <Button mode="contained" onPress={fetchCalidadData} style={styles.button}>
            Consultar Calidad
          </Button>
          <View style={styles.rowHeader}>
            <Text style={styles.headerCell}>CD Persona</Text>
            <Text style={styles.headerCell}>CD Calidad</Text>
            <Text style={styles.headerCell}>Fecha Ini</Text>
            <Text style={styles.headerCell}>Fecha Fin</Text>
            <Text style={styles.headerCell}>Desc Cred</Text>
            <Text style={styles.headerCell}>Desc Cont</Text>
            <Text style={styles.headerCell}>Tipo Precio</Text>
            <Text style={styles.headerCell}>Precio Kilo</Text>
          </View>
        </View>
      ),
    },
  ];

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => item.keyExtractor(item, index)}
      renderItem={({ section, item }) => section.renderItem({ item })}
      renderSectionHeader={({ section }) => (
        <View>
          <Text style={styles.title}>{section.title}</Text>
          {section.header}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No hay datos disponibles</Text>}
    />
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
  input: {
    marginBottom: 20,
  },
  button: {
    marginBottom: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 30,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  cell: {
    flex: 1,
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
});
