import React, { useState } from 'react';
import { Modal, View, Text, Button, FlatList, StyleSheet } from 'react-native';

const PrevisualizarPedido = ({ visible, onClose, pedido, onEnviar }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.header}>Previsualización del Pedido</Text>
          <FlatList
            data={pedido}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Text style={styles.item}>
                Cod: {item.CDVENTA} - {item.descProd} - Cant: {item.CANTIDAD} - Precio: ¢{item.precio}
              </Text>
            )}
          />
          <View style={styles.buttonContainer}>
            <Button title="Enviar Pedido" onPress={onEnviar} color="#427a5b" />
            <Button title="Cerrar" onPress={onClose} color="#d9534f" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    fontSize: 14,
    marginVertical: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
});

export default PrevisualizarPedido;
