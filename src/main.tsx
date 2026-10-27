import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'
import { startSync } from './sync'

render(<App />, document.getElementById('app')!)

startSync()
