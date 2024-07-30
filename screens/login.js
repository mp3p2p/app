import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import axios from 'axios';
import { VendedorContext } from '../VendedorContext';

const Login = () => {
  const { setVendedor } = useContext(VendedorContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    axios.post('http://201.192.136.158:3001/login', { username, password })
      .then(response => {
        if (response.data.success) {
          setVendedor(response.data.vendedor);
        } else {
          setError('Usuario o contraseña incorrectos');
        }
      })
      .catch(error => {
        if (error.response) {
          // El servidor respondió con un estado fuera del rango 2xx
          setError(`Error al iniciar sesión: ${error.response.data.message || 'Error desconocido'}`);
        } else if (error.request) {
          // La solicitud fue hecha pero no se recibió respuesta
          setError('No se recibió respuesta del servidor');
        } else {
          // Algo sucedió al configurar la solicitud que desencadenó un error
          setError('Error al configurar la solicitud');
        }
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        label="Usuario"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Iniciar Sesión
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default Login;
