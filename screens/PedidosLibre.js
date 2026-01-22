import React, { useCallback, useEffect, useState, useRef, useContext, useMemo } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
  Dimensions,
  LogBox,
  Platform,
  Modal,
  Keyboard,
} from 'react-native';
import { TextInput, Button, Card, Divider } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import Feather from 'react-native-vector-icons/Feather';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import axios from 'axios';
import { VendedorContext } from '../VendedorContext';
import debounce from 'lodash.debounce';
import * as Location from 'expo-location';
import { BASE_URL } from './config';
import PrevisualizarPedido from './PrevisualizarPedido';
import { MaterialIcons } from '@expo/vector-icons';

Feather.loadFont();

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

  const [valorPic, setValorPic] = useState('');
  const [cdentregaU, setcdentrega] = useState('');
  const [observa, setObserva] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const [descripcionProducto, setDescripcionProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState('');

  const [nombreVendedor, setNombreVendedor] = useState('');
  const [quintales, setQuintales] = useState(0);

  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [gpsLocal, setGpsLocal] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [modalPrevisualizar, setModalPrevisualizar] = useState(false);

  const [mainArray, setMainArray] = useState([]);
  const [arrayEnvia, setArrayEnvia] = useState([]);
  const [kt, setKt] = useState(0);

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
      if (response.data && response.data.length > 0) setNombreVendedor(response.data[0].NOMBRE);
    } catch (error) {
      console.error('Error fetching vendedor nombre:', error);
    }
  };

  const fetchData = async () => {
    await getCdEntrega();
    const resp = await fetch(`${BASE_URL}/productos`);
    const data1 = await resp.json();
    setData(data1);

    setMainArray([]);
    setArrayEnvia([]);
    setKt(0);
    setQuintales(0);
  };

  const getCdEntrega = async () => {
    try {
      const getResponse = await axios.get(`${BASE_URL}/cdcargap`);
      let ids = getResponse.data.map((item) => item.NEXTVAL);
      setcdentrega(ids.toString());
    } catch {
      Alert.alert('Error', 'Error al obtener el número de pedido');
    }
  };

  const calQuintales = (toqq) => {
    const nuevo = toqq + kt;
    setKt(nuevo);
    setQuintales(nuevo.toFixed(2));
    return nuevo.toFixed(2);
  };

  const getLocales = async (id) => {
    try {
      const getResponse = await axios.get(`${BASE_URL}/locales`, {
        params: { cdcliente: parseInt(id, 10) },
      });
      setLocales(getResponse.data);
    } catch {
      Alert.alert('Error', 'Error al obtener locales');
    }
  };

  const buscaUbica = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }
    try {
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 100,
      });
      setLocation(loc);
    } catch (e) {
      console.log('Error while trying to get location: ', e);
    }
  };

  const latAuto = location?.coords?.latitude;
  const lngAuto = location?.coords?.longitude;

  const tomarGpsLocal = async () => {
    if (!valorPic) return Alert.alert('Aviso', 'Primero seleccione un local');

    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Debe permitir ubicación para capturar el GPS.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 2000,
      });

      setGpsLocal({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        timestamp: pos.timestamp || Date.now(),
      });

      Alert.alert('Listo', `GPS capturado:\n${pos.coords.latitude}\n${pos.coords.longitude}`);
    } catch (e) {
      console.log('Error GPS:', e);
      Alert.alert('Error', 'No se pudo tomar el GPS. Intente de nuevo.');
    } finally {
      setGpsLoading(false);
    }
  };

  const agregaCliente = (item) => {
    if (!cdentregaU || isNaN(parseInt(cdentregaU, 10))) {
      Alert.alert('El número de pedido no está definido, salir y volver a ingresar');
      return;
    }
    if (!item) return Alert.alert('No ha seleccionado el Cliente');

    setNbCliente(item.title);
    setCliente(item.id);
    getLocales(item.id);

    setValorPic('');
    setGpsLocal(null);
  };

  const buscaDuplicado = (datacdventa) => {
    if (!datacdventa) return false;
    return mainArray.some((vt) => vt.CDVENTA === datacdventa.CDVENTA.toString());
  };

  const agregaProdcutos = () => {
    if (!cliente) return Alert.alert('Aviso', 'Debe seleccionar el cliente primero');
    if (!valorPic) return Alert.alert('Aviso', 'Debe seleccionar el local primero');

    if (CDVENTA.trim() === '' || CANTIDAD.trim() === '') {
      Alert.alert('Error', 'El código de producto y la cantidad no pueden estar vacíos');
      return;
    }

    const newData = data.find((user) => user.CDVENTA === parseInt(CDVENTA, 10));
    if (!newData) return Alert.alert('Aviso', 'No existe el código de Producto');
    if (buscaDuplicado(newData)) return Alert.alert('Aviso', `Ya existe el código ${newData.CDVENTA} en el Pedido`);

    const descProd = newData.NBPRODUCTO.toString();
    const toqq = (newData.KILOS * Number(CANTIDAD)) / 46;
    calQuintales(toqq);

    const lineaUI = {
      id: Date.now(),
      CDCARGA: cdentregaU,
      CDVENTA,
      descProd,
      CANTIDAD,
      precio: precioProducto,
    };

    const lineaEnvia = {
      CDCARGA: cdentregaU,
      CDVENTA,
      CANTIDAD,
      CDVENTABANDEO: null,
      CANTBANDEO: null,
      CDVENTABONIFICA: null,
      CANTBONIFICA: null,
      CDTRANS: null,
    };

    setMainArray((prev) => [lineaUI, ...prev]);
    setArrayEnvia((prev) => [lineaEnvia, ...prev]);

    setCantidad('');
    setProducto('');
    setDescripcionProducto('');
    setPrecioProducto('');
    setSuggestionsList([]);

    productoInputRef.current && productoInputRef.current.focus();
  };

  const borraLinea = (id, cdventa) => {
    setMainArray((prev) => prev.filter((x) => x.id !== id));
    setArrayEnvia((prev) => prev.filter((x) => x.CDVENTA !== cdventa));
  };

  const reiniciarVariables = () => {
    setProducto('');
    setCantidad('');
    setLocales([]);
    setCliente('');
    setNbCliente('');
    setValorPic('');
    setObserva('');
    setDescripcionProducto('');
    setPrecioProducto('');
    setQuintales(0);
    setKt(0);
    setSuggestionsList([]);
    setGpsLocal(null);
    setMainArray([]);
    setArrayEnvia([]);
  };

  const enviaPedido = async () => {
    if (arrayEnvia.length === 0) return Alert.alert('Aviso', 'El pedido no tiene artículos');
    if (!cliente) return Alert.alert('Aviso', 'Seleccione el cliente');
    if (!valorPic) return Alert.alert('Aviso', 'Seleccione el local');

    const latFinal = gpsLocal?.latitude ?? latAuto;
    const lngFinal = gpsLocal?.longitude ?? lngAuto;

    try {
      await axios.post(`${BASE_URL}/pedido`, {
        CDCARGA: cdentregaU,
        DIA: new Date().getDate(),
        MES: new Date().getMonth() + 1,
        ANO: new Date().getFullYear(),
        CREDCONT: 'R',
        CDPUNTOVENTA: vendedor === 7603 ? '1' : '5',
        CDLOCAL: valorPic,
        PROCESADO: 0,
        OBSERVACION: `${observa} // ${latFinal ?? ''} ; ${lngFinal ?? ''}`,
        CDTRANS: '',
        CDPEDIDO: '',
        arrayEnvia,
      });

      Alert.alert('Correcto', 'Pedido registrado exitosamente');
      reiniciarVariables();
      await getCdEntrega();
    } catch (error) {
      Alert.alert('Error', 'Error al enviar el pedido');
      console.error(error);
    }
  };

  const fetchProductoDescripcion = async (codigoProducto) => {
    try {
      const responseDesc = await axios.get(`http://201.192.136.158:3001/productodesc?codigo=${codigoProducto}`);
      if (responseDesc.data && Array.isArray(responseDesc.data) && responseDesc.data.length > 0) {
        setDescripcionProducto(responseDesc.data[0].NBPRODUCTO);
      } else setDescripcionProducto('');

      const responsePrice = await axios.get(`http://201.192.136.158:3001/precioctepdto`, {
        params: {
          cdpersona_in: cliente,
          cdventa_in: codigoProducto,
          coniva_in: 1,
        },
      });

      if (responsePrice.data && responsePrice.data.resultado) {
        setPrecioProducto(parseFloat(responsePrice.data.resultado).toFixed(2));
      } else setPrecioProducto('');
    } catch (error) {
      console.error('Error fetching producto descripcion y precio:', error);
      setDescripcionProducto('');
      setPrecioProducto('');
    }
  };

  const handleProductoChange = (codigoProducto) => {
    setProducto(codigoProducto);
    if (codigoProducto) fetchProductoDescripcion(codigoProducto);
    else {
      setDescripcionProducto('');
      setPrecioProducto('');
    }
  };

  const onClearPress = useCallback(() => {
    setSuggestionsList([]);
    setCliente('');
    setNbCliente('');
    setLocales([]);
    setValorPic('');
    setGpsLocal(null);
  }, []);

  const onOpenSuggestionsList = useCallback(() => {}, []);

  const getSuggestions = useCallback(
    debounce(async (q) => {
      const filterToken = q.toLowerCase();
      if (typeof q !== 'string' || q.length < 2) {
        setSuggestionsList([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/clientes`);
        const items = await response.json();
        const suggestions = items
          .filter((item) => item.CP.toLowerCase().includes(filterToken))
          .map((item) => ({ id: item.CDCLIENTE, title: item.CP }));
        setSuggestionsList(suggestions);
      } catch {
        Alert.alert('Error', 'Error al obtener la lista de clientes');
      } finally {
        setLoading(false);
      }
    }, 600),
    []
  );

  const header = useMemo(() => {
    return (
      <View>
        <Card style={styles.headerCard} mode="elevated">
          <Card.Content>
            <Text style={styles.headerTitle}>Pedido Libre</Text>
            <Text style={styles.headerSub}>
              Vendedor: {nombreVendedor} · Pedido: {cdentregaU}
            </Text>

            <View style={styles.headerButtons}>
              <Button
                mode="contained"
                buttonColor="#2E7D32"
                onPress={enviaPedido}
                icon={() => <MaterialIcons name="send" size={18} color="#fff" />}
                style={styles.headerBtn}
              >
                Enviar
              </Button>

              <Button
                mode="outlined"
                onPress={() => setModalPrevisualizar(true)}
                icon={() => <MaterialIcons name="visibility" size={18} />}
                style={styles.headerBtn}
              >
                Previsualizar
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* ✅ Card Cliente con zIndex/elevation SUPER alto */}
        <Card style={styles.sectionCardClienteTop} mode="elevated">
          <Card.Content style={{ overflow: 'visible' }}>
            <Text style={styles.sectionTitle}>Cliente</Text>

            <View style={styles.dropdownWrap}>
              <AutocompleteDropdown
                ref={searchRef}
                controller={(controller) => (dropdownController.current = controller)}
                direction={Platform.select({ ios: 'down' })}
                dataSet={suggestionsList}
                onChangeText={getSuggestions}
                onSelectItem={(item) => item && agregaCliente(item)}
                debounce={600}
                suggestionsListMaxHeight={260}
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
                // ✅ CLAVE: lista flotante con absolute + zIndex/elevation
                suggestionsListContainerStyle={styles.suggestionsFloating}
                inputContainerStyle={styles.autocompleteInputContainer}
                containerStyle={{ flexGrow: 1, flexShrink: 1 }}
                renderItem={(item) => <Text style={{ padding: 15, fontSize: 13 }}>{item.title}</Text>}
                ChevronIconComponent={<Feather name="chevron-down" size={20} color="#000" />}
                ClearIconComponent={<Feather name="x-circle" size={18} color="#000" />}
                inputHeight={50}
                showChevron={false}
                closeOnBlur={false}
              />
            </View>

            {!!nbcliente && <Text style={styles.helperText}>Seleccionado: {nbcliente}</Text>}
          </Card.Content>
        </Card>

        {/* ✅ Cards de abajo con zIndex/elevation BAJO para que no tapen */}
        <Card style={styles.sectionCardLow} mode="elevated">
          <Card.Content style={{ overflow: 'visible' }}>
            <Text style={styles.sectionTitle}>Local</Text>

            <View style={styles.pickerBox}>
              <Picker
                selectedValue={valorPic}
                onValueChange={(valor) => {
                  setValorPic(valor);
                  setGpsLocal(null);
                }}
                itemStyle={{ height: 120 }}
              >
                <Picker.Item label="-Seleccione Local-" value="" />
                {locales.map((clien) => (
                  <Picker.Item key={clien.CDLOCAL} label={clien.CP} value={clien.CDLOCAL} />
                ))}
              </Picker>
            </View>

            <View style={{ marginTop: 10 }}>
              <Button
                mode="contained"
                buttonColor="#1F6FEB"
                onPress={tomarGpsLocal}
                disabled={!valorPic || gpsLoading}
                loading={gpsLoading}
                icon={() => <MaterialIcons name="my-location" size={18} color="#fff" />}
              >
                Tomar GPS del Local
              </Button>

              <Text style={styles.gpsText}>
                {gpsLocal
                  ? `GPS local: ${gpsLocal.latitude.toFixed(6)}, ${gpsLocal.longitude.toFixed(6)}`
                  : 'GPS local: (no capturado)'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.sectionCardLow} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionTitle}>Producto</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textinput}
                  mode="outlined"
                  label="Código Producto"
                  value={CDVENTA}
                  onChangeText={handleProductoChange}
                  keyboardType="numeric"
                  ref={productoInputRef}
                />
              </View>

              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.textinput}
                  mode="outlined"
                  label="Cantidad"
                  value={CANTIDAD}
                  keyboardType="numeric"
                  onChangeText={setCantidad}
                  onBlur={() => Keyboard.dismiss()}
                  ref={cantidadInputRef}
                />
              </View>
            </View>

            {!!descripcionProducto && <Text style={styles.descripcionText}>{descripcionProducto}</Text>}
            <Text style={styles.descripcionText}>Precio UND: ¢ {precioProducto}</Text>

            <View style={styles.buttonWrap}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(true)}
                icon={() => <MaterialIcons name="note-add" size={18} />}
              >
                Observación
              </Button>

              <Button
                mode="contained"
                buttonColor="#2E7D32"
                onPress={agregaProdcutos}
                icon={() => <MaterialIcons name="add-circle" size={18} color="#fff" />}
              >
                Agregar Producto
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.sectionCardLow} mode="elevated">
          <Card.Content>
            <View style={styles.kpiRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kpiLabel}>Total QQ</Text>
                <Text style={styles.kpiValue}>{quintales}</Text>
              </View>

              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.kpiLabel}>Líneas</Text>
                <Text style={styles.kpiValue}>{mainArray.length}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Text style={styles.sectionHeader}>Detalle de Pedido</Text>
        <Divider style={{ marginBottom: 8 }} />
      </View>
    );
  }, [
    nombreVendedor,
    cdentregaU,
    suggestionsList,
    loading,
    nbcliente,
    valorPic,
    locales,
    gpsLocal,
    gpsLoading,
    CDVENTA,
    CANTIDAD,
    descripcionProducto,
    precioProducto,
    quintales,
    mainArray.length,
  ]);

  const Item = ({ id, CDVENTA, CANTIDAD, descProd, precio }) => (
    <Card style={styles.itemCard} mode="outlined">
      <View style={styles.itemRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemTitle}>
            {CDVENTA} · Cant: {CANTIDAD}
          </Text>
          <Text style={styles.itemSub}>{descProd}</Text>
          {!!precio && <Text style={styles.itemSub}>Precio UND: ¢ {precio}</Text>}
        </View>
        <Button mode="text" textColor="#B91C1C" onPress={() => borraLinea(id, CDVENTA)}>
          Quitar
        </Button>
      </View>
    </Card>
  );

  return (
    <>
      <FlatList
        data={mainArray}
        renderItem={({ item }) => (
          <Item id={item.id} CDVENTA={item.CDVENTA} CANTIDAD={item.CANTIDAD} descProd={item.descProd} precio={item.precio} />
        )}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      />

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalView}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Observación</Text>
              <TextInput mode="outlined" label="Observación" value={observa} onChangeText={setObserva} />
              <View style={{ height: 12 }} />
              <Button mode="contained" buttonColor="#2E7D32" onPress={() => setModalVisible(false)}>
                Guardar
              </Button>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      <PrevisualizarPedido
        visible={modalPrevisualizar}
        onClose={() => setModalPrevisualizar(false)}
        pedido={mainArray}
        onEnviar={enviaPedido}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F7FB',
    padding: 12,
    paddingBottom: 24,
  },

  headerCard: { borderRadius: 16, marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
  headerSub: { marginTop: 4, color: '#6B7280', fontSize: 12 },
  headerButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  headerBtn: { flex: 1, borderRadius: 12 },

  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#111827', marginBottom: 10 },
  helperText: { marginTop: 8, fontSize: 12, color: '#374151', fontWeight: '700' },

  // ✅ Cliente arriba de todo (Android: elevation manda)
  sectionCardClienteTop: {
    borderRadius: 16,
    marginBottom: 12,
    position: 'relative',
    zIndex: 9999,
    elevation: 9999,
  },

  // ✅ Cards de abajo “bajitas”
  sectionCardLow: {
    borderRadius: 16,
    marginBottom: 12,
    position: 'relative',
    zIndex: 1,
    elevation: 1,
  },

  // ✅ Contenedor del dropdown con stacking
  dropdownWrap: {
    position: 'relative',
    zIndex: 99999,
    elevation: 99999,
  },

  // ✅ LISTA flotante real (absolute)
  suggestionsFloating: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    zIndex: 100000,
    elevation: 100000,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  autocompleteInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },

  pickerBox: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },

  gpsText: { marginTop: 8, fontSize: 12, color: '#4B5563' },

  textinput: { height: 44 },
  descripcionText: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '800',
    color: '#111827',
  },

  buttonWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10 },

  kpiRow: { flexDirection: 'row', alignItems: 'center' },
  kpiLabel: { fontSize: 12, color: '#6B7280', fontWeight: '800' },
  kpiValue: { fontSize: 18, color: '#111827', fontWeight: '900', marginTop: 2 },

  sectionHeader: { color: '#111827', fontSize: 14, fontWeight: '900', marginLeft: 6, marginBottom: 6 },

  itemCard: { borderRadius: 14, marginBottom: 8, backgroundColor: '#fff' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  itemTitle: { fontSize: 13, fontWeight: '900', color: '#111827' },
  itemSub: { marginTop: 4, fontSize: 12, color: '#6B7280' },

  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 20,
  },
  modalCard: { width: '92%', borderRadius: 16 },
});
