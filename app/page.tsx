import React from 'react';
import CollaborativeSudoku from '../components/CollaborativeSudoku';

export default function Home() {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <CollaborativeSudoku />
    </div>
  );
}