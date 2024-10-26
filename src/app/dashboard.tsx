"use client"

import { useState, useEffect } from 'react'
import Sidebar from '../components/sidebar'
import NewConnectionPopup from '../modals/new-connection-popup'
import { PoolData } from '../interfaces'
import Button from '../components/Button';
import DataTable from '@/components/DataTable'

export default function Dashboard() {
  // Storage of pools (connections for the user)
  const [pools, setPools] = useState<PoolData[]>([])

  // Store queries/actions for the connection
  const [selectedQuery, setSelectedQuery] = useState<string>('')
  const [queryHeaders, setQueryHeaders] = useState<string[]>([]);
  const [queryData, setQueryData] = useState<string[]>([]);

  // Connection storage
  const [selectedConnectionId, setSelectedConnectionId] = useState<number>(-1); // Para almacenar la conexión seleccionada
  const [selectedConnectionInfo, setSelectedConnectionInfo] = useState<PoolData | null>(null);
  const [isPoolConnected, setIsPoolConnected] = useState<boolean>(false);

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
        id: poolId,
      };

      setPools((prevPools) => [...prevPools, newData]);
      setSelectedConnectionId(poolId);
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

      const data = await res.json();
      console.log(data);

    } catch (error) {
      console.log(error)
      alert("Error al crear la conexión.");
    }
  }

  async function connect() {
    try {
      const password = prompt("Ingrese la contraseña de la DB");
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poolId: selectedConnectionId,
          password
        })
      });

      if (!res.ok) {
        if (res.status === 500) {
          const data = await res.json();
          alert(`Error al conectar a la DB. ${data.error}`);
          return;
        }
        alert("Error al conectar a la DB.");
        return;
      }

      setIsPoolConnected(true);
    } catch (error) {
      console.error("Error al conectar a la DB:", error);
    }
  }

  // Funcion que usa Sidebar para actualizar la conexión seleccionada
  function updateSelectedPool(poolId: number) {
    console.log("Updating selected conn to ", poolId)
    setSelectedConnectionId(poolId);
  }

  // Cargar los pools de conexión al cargar la página
  useEffect(() => {
    fetch('/api/pool').then(async (response) => {
      if (!response.ok) alert("Error al cargar las conexiones existentes.");
      const data = await response.json();
      console.log(data, typeof data);
      setPools(JSON.parse(data));
    })
  }, []);

  // Fetch all pool info when a connection is selected
  useEffect(() => {
    async function fetchConnectionInfo() {
      console.log("Fetching connection info...");

      if (selectedConnectionId === -1) return;
      const res = await fetch("/api/pool/", { method: "GET" })

      const data = await res.json();
      const pools = JSON.parse(data);

      setSelectedConnectionInfo(pools.find((pool: PoolData) => pool.id === selectedConnectionId));

      const res2 = await fetch(`/api/connections?poolId=${selectedConnectionId}`, { method: "GET" });
      setIsPoolConnected(res2.ok);
    }
    fetchConnectionInfo()
  }, [selectedConnectionId])

  async function executeQuery() {
    const query = selectedQuery;
    const poolId = selectedConnectionId;

    if (query === "" || poolId === -1) {
      alert("Selecciona una conexión y una consulta.");
      return;
    }

    const res = await fetch("/api/connections", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        poolId,
        query,
      }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        alert("Error al ejecutar la consulta. Se ha interrumpido la conexión.");
        setIsPoolConnected(false);
        return
      }

      alert("Error al ejecutar la consulta.");
      return;
    }

    const data = await res.json();
    if (data.headers.length === 0) {
      alert("No se encontraron resultados.");
    }
    setQueryHeaders(data.headers);
    setQueryData(data.data)
  }

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
            <option value="pk">Listar Llaves Primarias</option>
            <option value="fk">Listar Llaves Foráneas</option>
            <option value="indices">Listar Índices</option>
            <option value="procedures">Listar Store Procedures</option>
            <option value="triggers">Listar Triggers</option>
            <option value="views">Listar Vistas</option>
            <option value="checks">Listar Checks</option>
          </select>

          <Button text="Ejecutar" variant='primary' action={executeQuery} />

          <div className="bg-red w-fit h-fit p-4 rounded shadow-md">
            {(selectedConnectionId != -1) ? <h1>Estado de Conexion</h1> : <></>}
            {(selectedConnectionId != -1) ? ((isPoolConnected) ? <h1>Conectado</h1> : <div className="flex flex-row gap-y-1"><h1>Desconectado</h1> <Button action={() => { connect() }} id={`connect-${selectedConnectionId}`} text="Conectar" variant='primary' /> </div>) : <></>}
            <br />
            {(!selectedConnectionInfo) ? (<h1>Selecciona una conexion</h1>) : <h1>{selectedConnectionInfo.user}@{selectedConnectionInfo.host}:{selectedConnectionInfo.port}</h1>}
          </div>
        </div>

        <DataTable headers={queryHeaders} data={queryData} />
      </main>
    </div>
  )
}
