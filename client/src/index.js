import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

const configuredApiUrl = (process.env.REACT_APP_API_URL || '').trim();
if (configuredApiUrl) {
  axios.defaults.baseURL = configuredApiUrl.replace(/\/+$/, '');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
