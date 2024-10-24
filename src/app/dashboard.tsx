"use client"

import { useState, useEffect } from 'react'
import Sidebar from '../components/sidebar'
import NewConnectionPopup from '../modals/new-connection-popup'
import { PoolData } from '../interfaces'

export default function Dashboard() {
  const [pools, setPools] = useState<PoolData[]>([])
  const [selectedQuery, setSelectedQuery] = useState<string>('')
  const [selectedConnection, setSelectedConnection] = useState<number>(-1); // Para almacenar la conexión seleccionada
  const [queryResult, setQueryResult] = useState("");

  // Funcion que utiliza el popup para crear una nueva conexión
  // Esta accede a la API para guardar las creds (excepto la pass) 
  // para enlistar las conexiones creadas.
  async function createPool(host: string, port: string, user: string, db: string, pass: string) {
    let poolId = 0
    try {
      const response = await fetch('/api/pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host,
          user,
          database: db,
          port: parseInt(port),
          password: pass,
          connectionLimit: 5,
        }),
      });

      if (!response.ok) {
        alert("Error al conectarse a la DB. Verifica tus credenciales.");
        return;
      }

      const data = await response.json();
      poolId = data.poolId;

      const newData = {
        host: host,
        user: user,
        port: parseInt(port),
        database: db,
        poolId: poolId,
      };

      setPools((prevPools) => [...prevPools, newData]);
    } catch (error) {
      console.error("Error al crear el pool:", error);
    }

    // Crear la conexion ahora
    try {
      const res = await fetch("/api/connections/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poolId: poolId,
          password: pass,
        }),
      })

      if (!res.ok) {
        alert("Error al crear la conexión.");
      }

      const data = await res.json();
      console.log(data);

    } catch (error) {
      console.log(error)
      alert("Error al crear la conexión.");
    }
  }

  // Funcion que usa Sidebar para actualizar la conexión seleccionada
  function updateSelectedPool(poolId: number) {
    setSelectedConnection(poolId);
  }

  // Cargar los pools de conexión al cargar la página
  useEffect(() => {
    fetch('/api/pool').then(async (response) => {
      if (!response.ok) alert("Error al cargar las conexiones existentes.");
      const data = await response.json();
      setPools(JSON.parse(data));
    })
  }, []);

  return (
    <div className='flex flex-row'>
      <Sidebar pools={pools} onSelectPool={updateSelectedPool} />

      <NewConnectionPopup create_connection={createPool} />
      <main className="text-black pl-4 pt-2">
        <div className='float-top w-auto h-fit'>
          <label htmlFor="query-dropdown" className="block mb-2">Selecciona una consulta:</label>
          <select
            id="query-dropdown"
            className="border border-gray-300 p-2"
            value={selectedQuery}
            onChange={(e) => setSelectedQuery(e.target.value)}
          >
            <option value="">-- Seleccionar consulta --</option>
            <option value="tables">Listar Tablas</option>
            <option value="indices">Listar Índices</option>
            <option value="procedures">Listar Store Procedures</option>
            <option value="triggers">Listar Triggers</option>
            <option value="views">Listar Vistas</option>
            <option value="checks">Listar Checks</option>
          </select>
          <button className="ml-2 bg-blue-500 text-white p-2">Ejecutar</button>
          <br />
          <p>{queryResult}</p>
        </div>
      </main>
    </div>
  )
}
