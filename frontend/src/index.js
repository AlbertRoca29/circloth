import React from 'react';
import ReactDOM from 'react-dom/client';
import './utils/i18n';
import { BrowserRouter as Router } from 'react-router-dom';

import App from './App';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <>
        <App />
        <ToastContainer />
      </>
    </Router>
  </React.StrictMode>
);
