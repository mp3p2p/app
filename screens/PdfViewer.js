import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import PDFView from 'react-native-pdf';
import axios from 'axios';
import { Buffer } from 'buffer';

const PdfViewer = ({ route }) => {
  const { cdfactura } = route.params;
  const [pdfUri, setPdfUri] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const response = await axios.get(`http://201.192.136.158:3001/getpdf/${cdfactura}`, {
          responseType: 'arraybuffer'
        });
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        setPdfUri(`data:application/pdf;base64,${base64}`);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching PDF:', error);
        setLoading(false);
      }
    };

    fetchPdf();
  }, [cdfactura]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pdfUri && (
        <PDFView
          source={{ uri: pdfUri }}
          style={styles.pdf}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdf: {
    flex: 1,
    width: '100%',
  },
});

export default PdfViewer;
