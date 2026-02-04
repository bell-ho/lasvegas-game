import React from 'react';

const Normal = ({ children }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      {children}
    </div>
  );
};
export default Normal;
