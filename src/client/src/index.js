import React from 'react'
import ReactDOM from 'react-dom'
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import { createMuiTheme } from '@material-ui/core/styles';

import CssBaseline from '@material-ui/core/CssBaseline';

import 'typeface-roboto'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'

import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'

import io from 'socket.io-client'

import reducer from './reducer'

const logger = createLogger()

const store = createStore(reducer, applyMiddleware(thunk, logger)) //logger must be last

const socket = io()
const events = [
  'body-marked-complete',
  'completed_bodies',
  'completed_jumps'
]
events.forEach(type => socket.on(type, p => store.dispatch({ type, ...p })))

const rootElement = document.getElementById('root')

const theme = createMuiTheme({
  palette: {
    type: 'dark',
  },
});


ReactDOM.render(
  <MuiThemeProvider theme={theme}>
    <Provider store={store}>
      <React.Fragment>
        <CssBaseline />
        <App />
      </React.Fragment>
    </Provider>
  </MuiThemeProvider>
  ,
  rootElement
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()

