import React, { useCallback, useEffect, useState, useRef, useContext } from 'react';
import { Alert, FlatList, StyleSheet, Text, View, Dimensions, ScrollView, LogBox, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import { Picker } from '@react-native-picker/picker';
import Feather from 'react-native-vector-icons/Feather';
import * as Location from 'expo-location';
import axios from 'axios';
import { VendedorContext } from '../VendedorContext'; // Ajusta la ruta según corresponda
import * as Device from 'expo-device';

Feather.loadFont();

let mainArray = [];
let arrayEnvia = [];
let latitude;
let longitude;
let kt = 0;
let server='74.208.150.36:3001';

export const PedidoLibre = () => {
  const { vendedor } = useContext(VendedorContext);
  const [CDVENTA, setProducto] = useState('');
  const [CANTIDAD, setCantidad] = useState('');
  const [data, setData] = useState([]);
  const [locales, setLocales] = useState([]);
  const [cliente, setCliente] = useState('');
  const [nbcliente, setNbCliente] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestionsList, setSuggestionsList] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [valorPic, setValorPic] = useState('');
  const [cdentregaU, setcdentrega] = useState('');
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [observa, setObserva] = useState('');
  const [quintales, setQuintales] = useState(0);
  const [state, setState] = useState(false);

  const dropdownController = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchData();
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
  }, []);

  const fetchData = async () => {
    await getCdEntrega();
    const resp = await fetch(`http://74.208.150.36:3001/productos`);
    const data1 = await resp.json();
    setData(data1);
    getNombreVende();
    mainArray = [];
    arrayEnvia = [];
    buscaUbica();
  };

  const buscaUbica = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      setLocation(location);
    } catch (e) {
      console.log('Error while trying to get location: ', e);
    }
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

  const getNombreVende = async () => {
    const getResponse = await axios.get(`http://74.208.150.36:3001/nombrexID`, {
      params: {
        cdpersona: vendedor,
      },
    });
    let ids = getResponse.data.map((item) => item.NOMBRE);
    setNbCliente(ids);
    return getResponse;
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

  const agregaCliente = () => {
    if (isNaN(parseInt(cdentregaU))) {
      Alert.alert('El número de pedido no está definido, salir y volver a ingresar');
    } else {
      if (!selectedItem) {
        Alert.alert('No ha seleccionado el Cliente');
      } else {
        setNbCliente(selectedItem);
        let idCliente = selectedItem.replace(/^ /, '');
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
      setSuggestionsList(null);
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

  const getSuggestions = useCallback(async (q) => {
    const filterToken = q.toLowerCase();
    if (typeof q !== 'string' || q.length < 2) {
      setSuggestionsList(null);
      return;
    }
    setLoading(true);
    const response = await fetch(`http://74.208.150.36:3001/clientes`);
    const items = await response.json();
    const suggestions = items
      .filter((item) => item.CP.toLowerCase().includes(filterToken))
      .map((item) => ({
        id: item.CDCLIENTE,
        title: item.CP,
      }));
    setSuggestionsList(suggestions);
    setLoading(false);
  }, []);

  const onClearPress = useCallback(() => {
    setSuggestionsList(null);
  }, []);

  const onOpenSuggestionsList = useCallback(() => {}, []);

  const enviaPedido = async () => {
    if (arrayEnvia.length === 0) {
      Alert.alert('El pedido no tiene Artículos');
      return;
    }

    try {
      await axios.post(`http://${server}/pedido`, {
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
    setSuggestionsList(null);
  };

  const borraLinea = (id, cdventa) => {
    mainArray = mainArray.filter((person) => person.id !== id);
    arrayEnvia = arrayEnvia.filter((person) => person.CDVENTA !== cdventa);
    setState(!state);
  };

  return (
    <View style={styles.container}>
      <View>
        <Button mode="contained" onPress={enviaPedido} style={styles.button}>
          Enviar Pedido {cdentregaU}
        </Button>
      </View>
      <View style={styles.autocompleteContainer}>
        <AutocompleteDropdown
          ref={searchRef}
          controller={(controller) => (dropdownController.current = controller)}
          dataSet={suggestionsList}
          onChangeText={getSuggestions}
          onSelectItem={(item) => item && setSelectedItem(item.title)}
          debounce={600}
          suggestionsListMaxHeight={Dimensions.get('window').height * 0.4}
          onClear={onClearPress}
          onOpenSuggestionsList={onOpenSuggestionsList}
          loading={loading}
          textInputProps={{
            placeholder: 'Buscar Clientes',
            autoCorrect: false,
            autoCapitalize: 'none',
            placeholderTextColor: '#000',
          }}
          rightButtonsContainerStyle={styles.rightButtonsContainer}
          inputHeight={50}
          showChevron={false}
          closeOnBlur={false}
          ClearIconComponent={<Feather name="x-circle" size={18} color="#000000" />}
        />
      </View>
      <Picker
        selectedValue={valorPic}
        onValueChange={(valor) => setValorPic(valor)}
        itemStyle={{ height: 120 }}
      >
        <Picker.Item label="-Seleccione Local-" value="" />
        {locales.map((clien) => (
          <Picker.Item key={clien.CDLOCAL} label={clien.CP} value={clien.CDLOCAL} />
        ))}
      </Picker>
      <Button mode="contained" onPress={agregaCliente} style={styles.button}>
        Agregar Cliente
      </Button>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textinput}
          mode="outlined"
          label="Código Producto"
          value={CDVENTA}
          onChangeText={setProducto}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.textinput}
          mode="outlined"
          label="Cantidad Producto"
          value={CANTIDAD}
          onChangeText={setCantidad}
          keyboardType="numeric"
        />
      </View>
      <TextInput
        style={styles.textinput}
        mode="outlined"
        label="Observación"
        value={observa}
        onChangeText={setObserva}
      />
      <Button mode="contained" onPress={agregaProdcutos} style={styles.button}>
        Agregar Producto
      </Button>
      <View>
        <Text style={styles.text}>Cliente: {nbcliente}</Text>
        <Text style={styles.text}>Local: {valorPic} QQ Total: {quintales}</Text>
        <Text style={styles.text}>Vendedor: {vendedor}</Text>
      </View>
      <Text style={styles.title}>------------------- DETALLE DE PEDIDO -------------------</Text>
      <ScrollView>
        <FlatList
          
          data={mainArray}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          extraData={state}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  button: {
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: '#427a5b',
  },
  autocompleteContainer: {
    marginVertical: 5,
  },
  rightButtonsContainer: {
    right: 8,
    height: 30,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textinput: {
    flex: 1,
    margin: 5,
    height: 40,
  },
  text: {
    color: '#000000',
    paddingVertical: 3,
    paddingLeft: 5,
    fontSize: 15,
  },
  title: {
    color: '#000000',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 10,
  },
  item: {
    padding: 1,
    marginVertical: 1,
    marginHorizontal: 10,
  },
});
