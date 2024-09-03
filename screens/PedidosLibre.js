import React, { useCallback, useEffect, useState, useRef, useContext } from 'react';
import { Alert, FlatList, StyleSheet, Text, View, Dimensions, ScrollView, LogBox, Platform, Modal, Keyboard } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import Feather from 'react-native-vector-icons/Feather';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import axios from 'axios';
import { VendedorContext } from '../VendedorContext';
import debounce from 'lodash.debounce';
import * as Location from 'expo-location';
import { BASE_URL } from './config';
Feather.loadFont();

let mainArray = [];
let arrayEnvia = [];
let kt = 0;
let latitude;
let longitud;

export const PedidoLibre = () => {
  const { vendedor } = useContext(VendedorContext);
  const [CDVENTA, setProducto] = useState('');
  const [CANTIDAD, setCantidad] = useState('');
  const [data, setData] = useState([]);
  const [locales, setLocales] = useState([]);
  const [cliente, setCliente] = useState('');
  const [nbcliente, setNbCliente] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestionsList, setSuggestionsList] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [valorPic, setValorPic] = useState('');
  const [cdentregaU, setcdentrega] = useState('');
  const [observa, setObserva] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [descripcionProducto, setDescripcionProducto] = useState('');
  const [state, setState] = useState(false);
  const [nombreVendedor, setNombreVendedor] = useState('');
  const [quintales, setQuintales] = useState(0);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const searchRef = useRef(null);
  const dropdownController = useRef(null);
  const productoInputRef = useRef(null);
  const cantidadInputRef = useRef(null);

  useEffect(() => {
    fetchVendedorNombre();
    fetchData();
    buscaUbica();
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
  }, []);

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

  const fetchData = async () => {
    await getCdEntrega();
    const resp = await fetch(`http://74.208.150.36:3001/productos`);
    const data1 = await resp.json();
    setData(data1);
    mainArray = [];
    arrayEnvia = [];
  };

  const getCdEntrega = async () => {
    try {
      const getResponse = await axios.get(`http://74.208.150.36:3001/cdcargap`);
      let ids = getResponse.data.map((item) => item.NEXTVAL);
      setcdentrega(ids.toString());
      return getResponse;
    } catch {
      Alert.alert('Error al obtener el número de pedido');
    }
  };

  const calQuintales = (toqq) => {
    console.log(toqq);
    kt = toqq + kt;
    setQuintales(kt.toFixed(2));
    return kt.toFixed(2);
  };

  const getLocales = async (id) => {
    try {
      const getResponse = await axios.get(`http://74.208.150.36:3001/locales`, {
        params: {
          cdcliente: parseInt(id),
        },
      });
      setLocales(getResponse.data);
      return getResponse;
    } catch {
      Alert.alert('Error al obtener locales');
    }
  };

  const buscaUbica = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest, maximumAge: 100 });
      setLocation(location);
    } catch (e) {
      console.log('Error while trying to get location: ', e);
    }
  };

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = "OK";
    latitude = location.coords.latitude;
    longitud = location.coords.longitude;
  }

  const agregaCliente = (item) => {
    if (isNaN(parseInt(cdentregaU))) {
      Alert.alert('El número de pedido no está definido, salir y volver a ingresar');
    } else {
      if (!item) {
        Alert.alert('No ha seleccionado el Cliente');
      } else {
        setNbCliente(item.title);
        let idCliente = item.id;
        getLocales(idCliente);
        setCliente('');
      }
    }
  };

  const buscaDuplicado = (datacdventa) => {
    let tyU = mainArray.find((vt) => vt.CDVENTA === datacdventa.CDVENTA.toString());
    return tyU !== undefined;
  };

  const agregaProdcutos = () => {
    if (CDVENTA.trim() === '' || CANTIDAD.trim() === '') {
      Alert.alert('Error', 'El código de producto y la cantidad no pueden estar vacíos');
      return;
    }

    let newData = data.find((user) => user.CDVENTA === parseInt(CDVENTA));
    if (buscaDuplicado(newData)) {
      Alert.alert(`Ya existe el código ${newData.CDVENTA} en el Pedido`);
    } else if (!newData || CANTIDAD === '') {
      Alert.alert('No existe el código de Producto o está en Blanco, o no se ha digitado cantidad');
    } else {
      let descProd = newData.NBPRODUCTO.toString();
      let toqq = ((newData.KILOS * CANTIDAD) / 46);
      let calqq = calQuintales(toqq);
      console.log(kt);

      const listaProdcutos = {
        id: Date.now(),
        CDCARGA: cdentregaU,
        CDVENTA,
        descProd,
        CANTIDAD,
        CDVENTABANDEO: null,
        CANTBANDEO: null,
        CDVENTABONIFICA: null,
        CANTBONIFICA: null,
        CDTRANS: null,
      };

      const listaEnvia = {
        CDCARGA: cdentregaU,
        CDVENTA,
        CANTIDAD,
        CDVENTABANDEO: null,
        CANTBANDEO: null,
        CDVENTABONIFICA: null,
        CANTBONIFICA: null,
        CDTRANS: null,
      };

      mainArray.push(listaProdcutos);
      arrayEnvia.push(listaEnvia);
      setState(!state);
      setCantidad('');
      setProducto('');
      setDescripcionProducto('');
      setSelectedItem(null);
      setSuggestionsList([]);
      productoInputRef.current && productoInputRef.current.focus();
    }
  };

  const Item = ({ id, CDVENTA, CANTIDAD, descProd }) => (
    <View style={styles.item}>
      <Text
        onLongPress={() => borraLinea(id, CDVENTA)}
        style={{ marginTop: 5, fontSize: 14, fontWeight: 'normal' }}
      >
        Cod:{CDVENTA} Desc: {descProd} Cant: {CANTIDAD}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <Item
      id={item.id}
      CDVENTA={item.CDVENTA}
      CANTIDAD={item.CANTIDAD}
      descProd={item.descProd}
    />
  );

  const getSuggestions = useCallback(debounce(async (q) => {
    const filterToken = q.toLowerCase();
    if (typeof q !== 'string' || q.length < 2) {
      setSuggestionsList([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://74.208.150.36:3001/clientes`);
      const items = await response.json();
      const suggestions = items
        .filter((item) => item.CP.toLowerCase().includes(filterToken))
        .map((item) => ({
          id: item.CDCLIENTE,
          title: item.CP
        }));
      setSuggestionsList(suggestions);
    } catch (error) {
      Alert.alert('Error al obtener la lista de clientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, 600), []);

  const onClearPress = useCallback(() => {
    setSuggestionsList([]);
    setCliente('');
  }, []);

  const onOpenSuggestionsList = useCallback((isOpened) => { }, []);

  const reiniciarVariables = () => {
    setProducto('');
    setCantidad('');
    setLocales([]);
    setCliente('');
    setNbCliente('');
    setValorPic('');
    setcdentrega('');
    setObserva('');
    setDescripcionProducto('');
    setState(false);
    setQuintales(0);
    setSuggestionsList([]);
    mainArray = [];
    arrayEnvia = [];
  };

  const enviaPedido = async () => {
    if (arrayEnvia.length === 0) {
      Alert.alert('El pedido no tiene Artículos');
      return;
    }

    try {
      await axios.post(`http://74.208.150.36:3001/pedido`, {
        CDCARGA: cdentregaU,
        DIA: new Date().getDate(),
        MES: new Date().getMonth() + 1,
        ANO: new Date().getFullYear(),
        CREDCONT: 'R',
        CDPUNTOVENTA: '5',
        CDLOCAL: valorPic,
        PROCESADO: 0,
        OBSERVACION: `${observa} // ${latitude} ; ${longitud}`,
        CDTRANS: '',
        CDPEDIDO: '',
        arrayEnvia,
      });

      Alert.alert('Correcto', 'Pedido registrado exitosamente');
      reiniciarVariables();
      await getCdEntrega();
    } catch (error) {
      Alert.alert('Error al enviar el pedido');
      console.error(error);
    }
  };

  const borraLinea = (id, cdventa) => {
    mainArray = mainArray.filter((person) => person.id !== id);
    arrayEnvia = arrayEnvia.filter((person) => person.CDVENTA !== cdventa);
    setState(!state);
  };

  const fetchProductoDescripcion = async (codigoProducto) => {
    console.log(codigoProducto);
    try {
      const response = await axios.get(`http://201.192.136.158:3001/productodesc?codigo=${codigoProducto}`);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setDescripcionProducto(response.data[0].NBPRODUCTO);
        console.log(response.data[0].NBPRODUCTO);
      } else {
        setDescripcionProducto('');
      }
    } catch (error) {
      console.error('Error fetching producto descripcion:', error);
      setDescripcionProducto('');
    }
  };

  const handleProductoChange = (codigoProducto) => {
    setProducto(codigoProducto);
    if (codigoProducto) {
      fetchProductoDescripcion(codigoProducto);
    } else {
      setDescripcionProducto('');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.vendedorText}>Vendedor: {nombreVendedor}</Text>
      <View>
        <Button
          mode="contained"
          buttonColor="#427a5b"
          style={styles.buttonSmall}
          onPress={enviaPedido}
        >
          Enviar Pedido {cdentregaU}
        </Button>
      </View>
      <View style={{ marginTop: 2 }}>
        <AutocompleteDropdown
          ref={searchRef}
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
          onOpenSuggestionsList={onOpenSuggestionsList}
          loading={loading}
          useFilter={false}
          textInputProps={{
            placeholder: 'Buscar Clientes',
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
            <Text style={{ padding: 15, fontSize: 13 }}>{item.title}</Text>
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
      </View>
      <Picker
        selectedValue={valorPic}
        onValueChange={(valor) => setValorPic(valor)}
        itemStyle={{ height: 120 }}
      >
        <Picker.Item label="-Seleccione Local-" value="" />
        {locales.map((clien) => (
          <Picker.Item
            key={clien.CDLOCAL}
            label={clien.CP}
            value={clien.CDLOCAL}
          />
        ))}
      </Picker>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', height: 45 }}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.textinput}
            mode="outlined"
            label="Codigo Producto"
            value={CDVENTA}
            onChangeText={handleProductoChange}
            keyboardType="numeric"
            ref={productoInputRef}
          />
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.textinput}
            mode="outlined"
            label="Cantidad Producto"
            value={CANTIDAD}
            keyboardType="numeric"
            onChangeText={setCantidad}
            onBlur={() => {
              Keyboard.dismiss(); // Oculta el teclado cuando se pierde el foco
            }}
            ref={cantidadInputRef}
          />
        </View>
      </View>
      <Text style={styles.descripcionText}>{descripcionProducto}</Text>
      <View style={styles.buttonWrap}>
        <Button mode="contained" onPress={() => setModalVisible(true)} buttonColor="#427a5b">
          Añadir Observación
        </Button>
        <Button mode="contained" onPress={agregaProdcutos} buttonColor="#427a5b">
          Agregar Producto
        </Button>
      </View>
      <Text style={styles.sectionHeader}>
        Total QQ: {quintales}
      </Text>
      <Text style={styles.sectionHeader}>
        {" "}---------- DETALLE DE PEDIDO ----------{" "}
      </Text>
      <FlatList
        data={mainArray}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        extraData={state}
        scrollEnabled={false}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <TextInput
            style={styles.modalTextinput}
            mode="outlined"
            label="Observación"
            value={observa}
            onChangeText={setObserva}
          />
          <Button
            mode="contained"
            onPress={() => setModalVisible(false)}
            color="#427a5b"
            style={styles.modalButton}
          >
            Guardar
          </Button>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  vendedorText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonSmall: {
    marginVertical: 5,
    marginHorizontal: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  buttonWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputWrap: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  textinput: {
    height: 40,
  },
  descripcionText: {
    fontSize: 13,
    marginTop: 5,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionHeader: {
    color: '#000000',
    fontSize: 15,
    justifyContent: 'center',
    marginLeft: 10,
    marginBottom: 10,
  },
  item: {
    padding: 1,
    marginVertical: 1,
    marginHorizontal: 10,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalTextinput: {
    width: '80%',
    marginBottom: 20,
  },
  modalButton: {
    width: '80%',
  },
});

export default PedidoLibre;
