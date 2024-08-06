import React, { useState, useContext } from 'react';
import { View, StyleSheet, ImageBackground, Image } from 'react-native';
import { Button, TextInput, Text } from 'react-native-paper';
import axios from 'axios';
import { VendedorContext } from '../VendedorContext';
import { BASE_URL } from './config';
import fondoapp from '../assets/fondoapp.png';  // Asegúrate de que la ruta sea correcta
import logo from '../assets/Logo.png';  // Asegúrate de que la ruta sea correcta

const Login = () => {
  const { setVendedor } = useContext(VendedorContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    axios.post(`${BASE_URL}/login`, { username, password })
      .then(response => {
        if (response.data.success) {
          setVendedor(response.data.vendedor);
        } else {
          setError('Usuario o contraseña incorrectos');
        }
      })
      .catch(error => {
        if (error.response) {
          setError(`Error al iniciar sesión: ${error.response.data.message || 'Error desconocido'}`);
        } else if (error.request) {
          setError('No se recibió respuesta del servidor');
        } else {
          setError('Error al configurar la solicitud');
        }
      });
  };

  return (
    <ImageBackground source={fondoapp} style={styles.background} imageStyle={styles.image}>
      <View style={styles.container}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>Iniciar Sesión</Text>
        <TextInput
          label="Usuario"
          value={username}
          onChangeText={setUsername}
          theme={{ colors: { text: 'white' } }}
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
        <Button mode="contained" onPress={handleLogin} style={styles.button} buttonColor="#427a5b">
          Iniciar Sesión
        </Button>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  image: {
    resizeMode: 'stretch', // Puedes cambiar 'cover' por 'contain', 'stretch', 'center', etc.
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center', // Centra el contenido horizontalmente
    padding: 16,
  },
  logo: {
    width: 210,  // Ajusta el ancho según sea necesario
    height: 140, // Ajusta la altura según sea necesario
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    width: '100%', // Asegura que el input ocupe todo el ancho disponible
  },
  button: {
    marginTop: 16,
    width: '100%', // Asegura que el botón ocupe todo el ancho disponible
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default Login;
