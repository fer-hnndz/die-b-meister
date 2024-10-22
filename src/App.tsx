import { useState } from 'react'
import Sidebar from './components/sidebar'
import NewConnectionPopup from './modals/new-connection-popup'

function App() {

  return (
    <>
      <Sidebar />
      <NewConnectionPopup />
      <h1>Hola Mundo</h1>
    </>
  )
}

export default App
