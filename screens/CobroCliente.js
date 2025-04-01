// Pantalla Cobro completa, funcional y corregida

import React, { useState, useRef, useCallback, useContext } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, Platform, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
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
  const dropdownController = useRef(null);

  const [cliente, setCliente] = useState('');
  const [nbcliente, setNbCliente] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [saldoPendiente, setSaldoPendiente] = useState(0);
  const [pagos, setPagos] = useState([]);
  const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);

  const [modalVisible, setModalVisible] = useState(false);
  const [tipoPago, setTipoPago] = useState('');
  const [montoPago, setMontoPago] = useState('');
  const [refPago, setRefPago] = useState('');
  const [chequePago, setChequePago] = useState('');
  const [fechaPago, setFechaPago] = useState('');

  const getSuggestions = useCallback(debounce(async (q) => {
    if (typeof q !== 'string' || q.length < 2) {
      setSuggestionsList([]);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/clientes`);
      const items = response.data;
      const suggestions = items
        .filter((item) => item.CP.toLowerCase().includes(q.toLowerCase()))
        .map((item) => ({ id: item.CDCLIENTE, title: item.CP }));
      setSuggestionsList(suggestions);
    } catch (error) {
      Alert.alert('Error al obtener clientes');
    } finally {
      setLoading(false);
    }
  }, 600), []);

  const onClearPress = useCallback(() => {
    setSuggestionsList([]);
    setCliente('');
    setNbCliente('');
    setDocumentos([]);
    setSeleccionados([]);
    setPagos([]);
    setSaldoPendiente(0);
  }, []);

  const agregaCliente = (item) => {
    if (item) {
      setCliente(item.id);
      setNbCliente(item.title);
      consultarDocumentos(item.id);
    } else {
      Alert.alert('No ha seleccionado un Cliente');
    }
  };

  const consultarDocumentos = async (cdpersona) => {
    try {
      const [resCXC, resCXP] = await Promise.all([
        axios.get(`${BASE_URL}/selectcxc`, { params: { cdpersona } }),
        axios.get(`${BASE_URL}/selectcxp`, { params: { cdpersona } }),
      ]);

      let docs = [];

      if (resCXC.data !== '0') {
        docs = docs.concat(
          resCXC.data.map((d, index) => ({
            id: `cxc-${index}`,
            tipo: 'CXC',
            monto: parseFloat(d.SALDO),
            descripcion: d.OBSERVACION,
            fecha: d.FCINI,
          }))
        );
      }

      if (resCXP.data !== '0') {
        docs = docs.concat(
          resCXP.data.map((d, index) => ({
            id: `cxp-${index}`,
            tipo: 'CXP',
            monto: parseFloat(d.SALDO),
            descripcion: d.OBSERVACION,
            fecha: d.FCINI,
          }))
        );
      }

      setDocumentos(docs);
      setSeleccionados([]);
      setSaldoPendiente(0);
    } catch (error) {
      Alert.alert('Error al consultar documentos');
    }
  };

  const toggleSeleccion = (doc) => {
    let nuevosSeleccionados = [];
    if (seleccionados.find((d) => d.id === doc.id)) {
      nuevosSeleccionados = seleccionados.filter((d) => d.id !== doc.id);
    } else {
      nuevosSeleccionados = [...seleccionados, doc];
    }
    setSeleccionados(nuevosSeleccionados);

    let totalCXC = nuevosSeleccionados
      .filter((d) => d.tipo === 'CXC')
      .reduce((sum, d) => sum + d.monto, 0);

    let totalCXP = nuevosSeleccionados
      .filter((d) => d.tipo === 'CXP')
      .reduce((sum, d) => sum + d.monto, 0);

    const saldo = totalCXC - totalCXP;
    setSaldoPendiente(saldo);
    setPagos([]);
  };

  const abrirModalPago = (tipo) => {
    setTipoPago(tipo);
    setMontoPago('');
    setRefPago('');
    setChequePago('');
    setFechaPago('');
    setModalVisible(true);
  };

  const agregarPago = () => {
    const monto = parseFloat(montoPago);
    if (isNaN(monto) || monto <= 0) {
      Alert.alert('Ingrese un monto válido');
      return;
    }
    if (monto + totalPagos > saldoPendiente) {
      Alert.alert('El monto total no puede superar el saldo pendiente');
      return;
    }
    const nuevoPago = {
      tipo: tipoPago,
      monto: monto.toFixed(2),
      referencia: refPago,
      cheque: chequePago,
      fecha: fechaPago,
    };
    setPagos([...pagos, nuevoPago]);
    setModalVisible(false);
  };

  const finalizarCobro = async () => {
    if (totalPagos !== saldoPendiente) {
      Alert.alert('El total de pagos debe ser igual al saldo pendiente');
      return;
    }
    try {
      await axios.post(`${BASE_URL}/guardarCobro`, {
        CDPERSONA: cliente,
        documentos: seleccionados,
        pagos,
        vendedor,
      });
      Alert.alert('Cobro registrado correctamente');
      onClearPress();
    } catch (error) {
      Alert.alert('Error al guardar el cobro');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.vendedorText}>Vendedor: {vendedor}</Text>

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
        renderItem={(item) => (
          <Text style={{ padding: 15, fontSize: 13 }}>{item.title}</Text>
        )}
        ChevronIconComponent={<Feather name="chevron-down" size={20} color="#000000" />}
        ClearIconComponent={<Feather name="x-circle" size={18} color="#000000" />}
        inputHeight={50}
        showChevron={false}
        closeOnBlur={false}
      />

      {nbcliente !== '' && (
        <View style={styles.clienteContainer}>
          <Text style={styles.clienteValue}>{cliente} - {nbcliente}</Text>
        </View>
      )}

      <Text style={styles.sectionHeader}>Documentos</Text>
      <View style={styles.docsContainer}>
        {documentos.map((doc, index) => {
          const seleccionado = seleccionados.find((d) => d.id === doc.id);
          return (
            <TouchableOpacity key={index} onPress={() => toggleSeleccion(doc)}>
              <Card
                style={[styles.docCard, {
                  borderColor: doc.tipo === 'CXP' ? '#FF4B5C' : '#60D394',
                  backgroundColor: seleccionado ? '#555' : '#222',
                }]}
              >
                <Card.Content>
                  <Text style={{ color: doc.tipo === 'CXP' ? '#FF4B5C' : '#60D394', fontSize: 10 }}>{doc.tipo}</Text>
                  <Text style={styles.docMonto}>₡ {doc.monto.toFixed(2)}</Text>
                  {seleccionado && <Text style={{ color: '#FFD700', fontSize: 10 }}>✔ Seleccionado</Text>}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.formaPago}>Formas de Pago</Text>
      <View style={styles.pagosContainer}>
        <Button mode="contained" buttonColor="#FF4B5C" style={styles.pagoBtn} onPress={() => abrirModalPago('Efectivo')}>+ Efectivo</Button>
        <Button mode="outlined" style={styles.pagoBtn} onPress={() => abrirModalPago('Transferencia')}>+ Transf</Button>
        <Button mode="outlined" style={styles.pagoBtn} onPress={() => abrirModalPago('Cheque')}>+ Cheque</Button>
        <Button mode="outlined" style={styles.pagoBtn} onPress={() => abrirModalPago('Cheque Post')}>+ Cheq Post</Button>
      </View>

      <Text style={styles.sectionHeader}>Pagos Ingresados</Text>
      {pagos.map((p, index) => (
        <Text key={index} style={styles.pagoItem}>
          {p.tipo}: ₡ {p.monto}
        </Text>
      ))}

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Pagado:</Text>
        <Text style={styles.totalMonto}>{totalPagos.toFixed(2)}</Text>
      </View>

      <View style={styles.saldoContainer}>
        <Text style={styles.saldoTitle}>Saldo Pendiente</Text>
        <Text style={styles.saldoPendiente}>{saldoPendiente.toFixed(2)}</Text>
      </View>

      <Button mode="contained" style={styles.guardarBtn} onPress={finalizarCobro}>Finalizar Cobro</Button>

      {/* Modal Pago */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{tipoPago}</Text>
            <TextInput
              placeholder="Monto"
              style={styles.modalInput}
              keyboardType="numeric"
              value={montoPago}
              onChangeText={setMontoPago}
            />
            {tipoPago === 'Transferencia' && (
              <TextInput
                placeholder="Referencia"
                style={styles.modalInput}
                value={refPago}
                onChangeText={setRefPago}
              />
            )}
            {tipoPago === 'Cheque' && (
              <TextInput
                placeholder="N° Cheque"
                style={styles.modalInput}
                value={chequePago}
                onChangeText={setChequePago}
              />
            )}
            {tipoPago === 'Cheque Post' && (
              <>
                <TextInput
                  placeholder="N° Cheque"
                  style={styles.modalInput}
                  value={chequePago}
                  onChangeText={setChequePago}
                />
                <TextInput
                  placeholder="Fecha"
                  style={styles.modalInput}
                  value={fechaPago}
                  onChangeText={setFechaPago}
                />
              </>
            )}
            <View style={styles.modalButtons}>
              <Button onPress={() => setModalVisible(false)}>Cancelar</Button>
              <Button onPress={agregarPago}>Agregar</Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10, backgroundColor: '#000' },
  vendedorText: { color: '#fff', fontSize: 13, marginBottom: 10 },
  clienteContainer: { backgroundColor: '#333', padding: 10, borderRadius: 5, marginVertical: 10 },
  clienteValue: { color: '#fff' },
  sectionHeader: { color: '#fff', marginVertical: 10, fontSize: 14 },
  docsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  docCard: { width: 120, borderWidth: 2, borderRadius: 10, backgroundColor: '#222', margin: 5 },
  docMonto: { color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  formaPago: { color: '#fff', marginLeft: 10, marginBottom: 5 },
  pagosContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  pagoBtn: { margin: 5 },
  pagoItem: { color: '#fff', fontSize: 13, marginLeft: 10 },
  totalContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 15 },
  totalLabel: { color: '#FFD700', fontSize: 16, marginRight: 5 },
  totalMonto: { color: '#FF4B5C', fontSize: 16 },
  saldoContainer: { backgroundColor: '#444', padding: 10, marginVertical: 20, borderRadius: 10, alignItems: 'center' },
  saldoTitle: { color: '#fff', fontSize: 14, marginBottom: 5 },
  saldoPendiente: { color: '#FF4B5C', fontSize: 16 },
  guardarBtn: { backgroundColor: '#9b59b6' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', width: '80%', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  modalInput: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginVertical: 5, borderRadius: 5 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});
