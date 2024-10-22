import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Sidebar from './components/sidebar'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Sidebar />
      <h1>Hola Mundo</h1>
    </>
  )
}

export default App
