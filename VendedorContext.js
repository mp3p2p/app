import React, { createContext, useState } from 'react';

export const VendedorContext = createContext();

export const VendedorProvider = ({ children }) => {
  const [vendedor, setVendedor] = useState('');

  return (
    <VendedorContext.Provider value={{ vendedor, setVendedor }}>
      {children}
    </VendedorContext.Provider>
  );
};
