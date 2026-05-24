import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Web Components 정의 로드
import './common.js'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)