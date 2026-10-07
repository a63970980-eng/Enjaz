import React from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import {App} from './App';
import '../auth-gate-v2.js';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);