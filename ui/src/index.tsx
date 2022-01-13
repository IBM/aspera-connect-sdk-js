import 'react-app-polyfill/ie11';
import React from 'react';
import ReactDOM from 'react-dom';
import './styles/application.scss';
import App from './components/App';

ReactDOM.render(
  <App />,
  document.getElementById('aspera-connect-ui-root')
);
