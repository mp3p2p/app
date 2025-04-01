import React, { useState, useRef, useCallback, useContext } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, Platform, Alert } from 'react-native';
import { Button, Card } from 'react-native-paper';
import Feather from 'react-native-vector-icons/Feather';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import axios from 'axios';
import { VendedorContext } from '../VendedorContext';
import debounce from 'lodash.debounce';
import { BASE_URL } from './config';

Feather.loadFont();

 export const CobroCliente = () => {
  const { vendedor } = useContext(VendedorContext);
  const [total, setTotal] = useState(0.0);
  const [saldoPendiente, setSaldoPendiente] = useState(0.0);
  const [saldoFavor, setSaldoFavor] = useState(0.0);
  const [cliente, setCliente] = useState('');
  const [nbcliente, setNbCliente] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestionsList, setSuggestionsList] = useState([]);
  const dropdownController = useRef(null);

  const documentos = [
    { tipo: 'DEVOLUCIÓN DE', monto: 12554.27, color: '#FF4B5C' },
    { tipo: 'FACTURA CRÉD.', monto: 89333.30, color: '#60D394' },
    { tipo: 'FACTURA CRÉD.', monto: 267332.72, color: '#60D394' },
  ];

  const getSuggestions = useCallback(debounce(async (q) => {
    const filterToken = q.toLowerCase();
    if (typeof q !== 'string' || q.length < 2) {
      setSuggestionsList([]);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/clientes`);
      const items = response.data;
      const suggestions = items
        .filter((item) => item.CP.toLowerCase().includes(filterToken))
        .map((item) => ({
          id: item.CDCLIENTE,
          title: item.CP
        }));
      setSuggestionsList(suggestions);
    } catch (error) {
      Alert.alert('Error al obtener la lista de clientes');
    } finally {
      setLoading(false);
    }
  }, 600), []);

  const onClearPress = useCallback(() => {
    setSuggestionsList([]);
    setCliente('');
    setNbCliente('');
  }, []);

  const agregaCliente = (item) => {
    if (item) {
      setCliente(item.id);
      setNbCliente(item.title);
    } else {
      Alert.alert('No ha seleccionado un Cliente');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.vendedorText}>Vendedor: {vendedor}</Text>

      <View style={{ marginTop: 10 }}>
        <AutocompleteDropdown
          controller={(controller) => {
            dropdownController.current = controller;
          }}
          direction={Platform.select({ ios: 'down' })}
          dataSet={suggestionsList}
          onChangeText={getSuggestions}
          onSelectItem={(item) => {
            item && agregaCliente(item);
          }}
          debounce={600}
          suggestionsListMaxHeight={Dimensions.get('window').height * 0.4}
          onClear={onClearPress}
          loading={loading}
          useFilter={false}
          textInputProps={{
            placeholder: 'Buscar Clientes',
            autoCorrect: false,
            autoCapitalize: 'none',
            placeholderTextColor: '#000',
          }}
          renderItem={(item, text) => (
            <Text style={{ padding: 15, fontSize: 13 }}>{item.title}</Text>
          )}
          ChevronIconComponent={<Feather name="chevron-down" size={20} color="#000000" />}
          ClearIconComponent={<Feather name="x-circle" size={18} color="#000000" />}
          inputHeight={50}
          showChevron={false}
          closeOnBlur={false}
        />
      </View>

      {nbcliente !== '' && (
        <View style={styles.clienteContainer}>
          <Text style={styles.clienteValue}>{cliente} - {nbcliente}</Text>
        </View>
      )}

      <Text style={styles.sectionHeader}>Documentos</Text>
      <View style={styles.docsContainer}>
        {documentos.map((doc, index) => (
          <Card key={index} style={[styles.docCard, { borderColor: doc.color }]}>
            <Card.Content>
              <Text style={[styles.docTipo, { color: doc.color }]}>{doc.tipo}</Text>
              <Text style={styles.docMonto}>{doc.monto.toLocaleString()}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalMonto}>{total.toFixed(2)}</Text>
      </View>

      <Text style={styles.formaPago}>Formas de Pago</Text>
      <View style={styles.pagosContainer}>
        <Button mode="contained" buttonColor="#FF4B5C" style={styles.pagoBtn}>+ Efectivo</Button>
        <Button mode="outlined" style={styles.pagoBtn}>+ Transf</Button>
        <Button mode="outlined" style={styles.pagoBtn}>+ Cheque</Button>
        <Button mode="outlined" style={styles.pagoBtn}>+ Cheq Post</Button>
      </View>

      <View style={styles.saldoContainer}>
        <Text style={styles.saldoTitle}>Saldo Pendiente</Text>
        <View style={styles.saldoValores}>
          <Text style={styles.saldoPendiente}>{saldoPendiente.toFixed(2)}</Text>
          <Text style={styles.saldoFavor}> {saldoFavor.toFixed(2)}</Text>
        </View>
      </View>

      <Button mode="contained" style={styles.guardarBtn}>Guardar</Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#000',
  },
  vendedorText: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 10,
  },
  clienteContainer: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  clienteValue: {
    color: '#fff',
  },
  sectionHeader: {
    color: '#fff',
    marginVertical: 10,
    fontSize: 14,
  },
  docsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  docCard: {
    width: 100,
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  docTipo: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  docMonto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  totalLabel: {
    color: '#FFD700',
    fontSize: 16,
    marginRight: 5,
  },
  totalMonto: {
    color: '#FF4B5C',
    fontSize: 16,
  },
  formaPago: {
    color: '#fff',
    marginLeft: 10,
    marginBottom: 5,
  },
  pagosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  pagoBtn: {
    margin: 5,
  },
  saldoContainer: {
    backgroundColor: '#444',
    padding: 10,
    marginVertical: 20,
    borderRadius: 10,
  },
  saldoTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  saldoValores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saldoPendiente: {
    color: '#FF4B5C',
    fontSize: 16,
  },
  saldoFavor: {
    color: '#60D394',
    fontSize: 16,
  },
  guardarBtn: {
    backgroundColor: '#9b59b6',
  },
});


