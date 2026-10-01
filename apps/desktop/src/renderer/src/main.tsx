// UI entry point: mounts the React app into the page.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
// The theme first: the styles read its variables.
import './theme.css'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
