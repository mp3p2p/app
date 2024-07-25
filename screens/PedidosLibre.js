import React, { useCallback, useEffect, useState, useRef, useContext } from 'react';
import { Alert, FlatList, StyleSheet, Text, View, Dimensions, ScrollView, LogBox, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import Feather from 'react-native-vector-icons/Feather';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import axios from 'axios';
import { VendedorContext } from '../VendedorContext'; // Ajusta la ruta según corresponda
import debounce from 'lodash.debounce';

Feather.loadFont();

let mainArray = [];
let arrayEnvia = [];
let kt = 0;

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
  const [quintales, setQuintales] = useState(0);
  const [state, setState] = useState(false);

  const searchRef = useRef(null);
  const dropdownController = useRef(null);

  useEffect(() => {
    fetchData();
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
  }, []);

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
    let newData = data.find((user) => user.CDVENTA === parseInt(CDVENTA));
    if (buscaDuplicado(newData)) {
      Alert.alert(`Ya existe el codigo ${newData.CDVENTA} en el Pedido`);
    } else if (!newData || CANTIDAD === '') {
      Alert.alert('No existe el código de Producto o está en Blanco, o no se ha digitado cantidad');
    } else {
      let descProd = newData.NBPRODUCTO.toString();

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
      setSelectedItem(null);
      setSuggestionsList([]);
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
        OBSERVACION: `${observa} // ${latitude} ; ${longitude}`,
        CDTRANS: '',
        CDPEDIDO: '',
        arrayEnvia,
      });

      Alert.alert('Correcto', 'Pedido registrado exitosamente');
    } catch (error) {
      Alert.alert('Error al enviar el pedido');
      console.error(error);
    }

    mainArray = [];
    arrayEnvia = [];
    setState(!state);
    setNbCliente('');
    setValorPic('');
    setSuggestionsList([]);
  };

  const borraLinea = (id, cdventa) => {
    mainArray = mainArray.filter((person) => person.id !== id);
    arrayEnvia = arrayEnvia.filter((person) => person.CDVENTA !== cdventa);
    setState(!state);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Button
          mode="contained"
          color="#427a5b"
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
            onChangeText={setProducto}
            keyboardType="numeric"
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
          />
        </View>
      </View>
      <TextInput
        style={styles.textinput}
        mode="outlined"
        label="Observacion"
        value={observa}
        onChangeText={setObserva}
      />
      <Button
        mode="contained"
        onPress={agregaProdcutos}
        color="#427a5b"
        style={styles.buttonSmall}
      >
        Agregar Producto
      </Button>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  buttonSmall: {
    marginVertical: 5,
    marginHorizontal: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  inputWrap: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  textinput: {
    height: 40,
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
});
