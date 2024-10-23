"use client"

import { useState } from 'react'
import Sidebar from '../components/sidebar'
import NewConnectionPopup from '../modals/new-connection-popup'
import { PoolData } from '../interfaces'

export default function Dashboard() {
  const [pools, setPools] = useState<PoolData[]>([])

  async function createPool(name: string, host: string, port: string, user: string, db: string, pass: string) {
    try {
      // Enviar la solicitud a la API para crear un nuevo pool
      const response = await fetch('/api/pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host,
          user,
          password: pass,
          database: db,
          connectionLimit: 5, // Puedes ajustar esto según lo necesario
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      const poolId = data.poolId; // Obtener el ID del pool creado

      // Crear un objeto PoolData y añadirlo al estado
      const obj: PoolData = {
        host: host,
        user: user,
        port: parseInt(port),
        db: db,
        pass: pass,
        name: name,
        poolId: poolId, // Guardar el poolId en el estado
      };

      // Actualizar el estado de pools
      setPools((prevPools) => [...prevPools, obj]);
    } catch (error) {
      console.error("Error al crear el pool:", error);
      // Aquí podrías agregar lógica para manejar errores, como mostrar un mensaje al usuario
    }
  }

  return (
    <>
      <Sidebar pools={pools} />
      <NewConnectionPopup create_connection={createPool} />
      <h1>Hola Mundo</h1>
    </>
  )
}
