import React from 'react';

const Secret = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundImage: 'url(whiteback2.jpg)',
      }}
    >
      {children}
    </div>
  );
};
export default Secret;
