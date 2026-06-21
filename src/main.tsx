import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// No React.StrictMode — it causes double-mount which makes the camera
// initialize → stop → restart rapidly, breaking MediaPipe's video pipeline.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
