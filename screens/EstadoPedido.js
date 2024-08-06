import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

export const EstadoPedido = () => {
  const [pedidos, setPedidos] = useState([]);

  const fetchPedidos = async () => {
    try {
      const response = await axios.get('http://201.192.136.158:3001/reportepedidos');
      setPedidos(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const PedidoCard = ({
    cdcarga = 'No especificado',
    cdpedido = 'No especificado',
    cdfactura = 'No especificado',
    fcpedido = 'No especificado',
    estadohacienda = 'No especificado',
    cdlocal = 'No especificado',
    nombreCliente = 'No especificado',
    estado = 'No especificado',
  }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{nombreCliente}</Text>
      <View style={styles.cardContent}>
        <Text style={styles.label}>Carga: </Text>
        <Text style={styles.value}>{cdcarga}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.label}>Pedido: </Text>
        <Text style={styles.value}>{cdpedido}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.label}>Factura: </Text>
        <Text style={styles.value}>{cdfactura}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.label}>Fecha Pedido: </Text>
        <Text style={styles.value}>{fcpedido !== 'No especificado' ? format(parseISO(fcpedido), 'dd-MM-yyyy') : fcpedido}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.label}>Estado Hacienda: </Text>
        <Text style={styles.value}>{estadohacienda}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.label}>Local: </Text>
        <Text style={styles.value}>{cdlocal}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.label}>Estado: </Text>
        <Text style={styles.value}>{estado}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title="Recargar Datos" onPress={fetchPedidos} />
      <ScrollView>
        {pedidos.map((pedido, index) => (
          <PedidoCard
            key={index}
            cdcarga={pedido.CDCARGA}
            cdpedido={pedido.CDPEDIDO}
            cdfactura={pedido.CDFACTURA}
            fcpedido={pedido.FCPEDIDO}
            estadohacienda={pedido.ESTADOHACIENDA}
            cdlocal={pedido.CDLOCAL}
            nombreCliente={pedido["NOMBRE.CLIENTE(L.CDPERSONA)"]}
            estado={pedido.ESTADO}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    width: '40%',
  },
  value: {
    width: '60%',
  },
});
