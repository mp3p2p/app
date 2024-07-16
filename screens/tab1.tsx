import React, { useState } from 'react';
import {  View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Collapsible from 'react-native-collapsible'

export const Kpi= () => {
    const [collapsed, setCollapsed] = useState(true);
  return (
    <View style={styles.container}>
    <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={styles.header}>
      <Text style={styles.headerText}>Click me to {collapsed ? 'expand' : 'collapse'}</Text>
    </TouchableOpacity>
    <Collapsible collapsed={collapsed}>
      <View style={styles.content}>
        <Text>This is the expanded content!</Text>
      </View>
    </Collapsible>
  </View>
  )

}
const styles = StyleSheet.create({
  container: {
    margin: 20,
  },
  header: {
    backgroundColor: '#f1f1f1',
    padding: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 10,
    backgroundColor: '#e1e1e1',
  },
});


