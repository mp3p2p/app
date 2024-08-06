import React, { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { Kpi } from './screens/Kpi';
import { Pedidos } from './screens/Pedidos';
import Login from './screens/login';
import { VendedorProvider, VendedorContext } from './VendedorContext';
import { PedidoLibre } from './screens/PedidosLibre';
import { Descuentos } from './screens/Descuentos';
import { EstadoPedido } from './screens/EstadoPedido';

const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: '#ccc',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'Roboto',
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#ccc',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Kpi Vendedor') {
            iconName = 'analytics';
          } else if (route.name === 'Pedidos') {
            iconName = 'archive';
          } else if (route.name === 'PedidoLibre') {
            iconName = 'shopping-cart';
          }else if (route.name === 'Descuentos') {
            iconName = 'wallet';
          }else if (route.name === 'Descuentos') {
            iconName = 'wallet';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Kpi Vendedor" component={Kpi} />
      <Tab.Screen name="Pedidos" component={Pedidos} />
      <Tab.Screen name="PedidoLibre" component={PedidoLibre} />
      <Tab.Screen name="Descuentos" component={Descuentos} />
      <Tab.Screen name="Estado Pedido" component={EstadoPedido} />
    </Tab.Navigator>
  );
}

function App() {
  const { vendedor } = useContext(VendedorContext);

  return (
    <NavigationContainer>
      {vendedor ? <HomeTabs /> : <Login />}
    </NavigationContainer>
  );
}

export default function MainApp() {
  return (
    <VendedorProvider>
      <App />
    </VendedorProvider>
  );
}

const styles = StyleSheet.create({
  tabTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: '#007BFF',
  },
});
