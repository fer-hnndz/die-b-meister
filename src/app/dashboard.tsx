"use client"

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/sidebar'
import NewConnectionPopup from '../modals/new-connection-popup'
import { PoolData } from '../interfaces'
import Button from '../components/Button';
import DataTable from '@/components/DataTable'
import CreateTableModal from '@/modals/new-table'

export default function Dashboard() {
  // Storage of pools (connections for the user)
  const [pools, setPools] = useState<PoolData[]>([])

  // Modals
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState<boolean>(false);

  // Store queries/actions for the connection
  const [selectedQuery, setSelectedQuery] = useState<string>('tables')
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

  /*
  ========================
  Función para conectar a una base de datos
  ========================
  */
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


  /*
  ------------------------
  Obtener información de la conexión seleccionada para 
  mostarlo y poder conectarlo si el user desea
  ------------------------
  */
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


  /*
  ========================
  Callback para ejecutar una consulta.
  Wrappeada en un useCallback para evitar que se ejecute en cada renderizado.
  ========================
  */
  const executeQuery = useCallback(async () => {
    const query = selectedQuery;
    const poolId = selectedConnectionId;

    if (poolId === -1 || !isPoolConnected) return;

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
        console.log(await res.json());
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
  }, [selectedQuery, selectedConnectionId, isPoolConnected])

  /*
  ------------------------
  UseEffect que se ejecuta al cambiar la consulta seleccionada.
  Se encarga de ejecutar la consulta cuando esta cambia.
  ------------------------
  */
  useEffect(() => {
    async function exec() {
      executeQuery();
    }

    exec();
  }, [selectedQuery, executeQuery])

  /*
  *****************
  Funcion Helper donde el sidebar llama a esta funcion para actualizar la conexión seleccionada.
  *****************
  */
  function updateSelectedPool(poolId: number) {
    console.log("Updating selected conn to ", poolId)
    setSelectedConnectionId(poolId);
    setIsPoolConnected(false);
  }

  /*
  ------------------------
  UseEfffect que se ejecuta una vez al cargar la pagina para obtener los pools.
  ------------------------
  */
  useEffect(() => {
    fetch('/api/pool').then(async (response) => {
      if (!response.ok) alert("Error al cargar las conexiones existentes.");
      const data = await response.json();
      console.log(data, typeof data);
      setPools(JSON.parse(data));
    })
  }, []);


  return (
    <div className='flex flex-row'>
      <Sidebar pools={pools} onSelectPool={updateSelectedPool} />

      <CreateTableModal
        isOpen={isCreateTableModalOpen}
        onClose={(query?: string) => {
          if (!query) return;
          console.warn(query)
          setIsCreateTableModalOpen(false)
        }}
        onCancel={() => { setIsCreateTableModalOpen(false) }}


      />

      <NewConnectionPopup create_connection={createPool} />
      <main className="text-black pt-2 overflow-x-hidden">
        <div className='float-top w-auto h-fit'>

          <div className="bg-red w-fit h-fit p-4 rounded shadow-md ml-2">
            {(selectedConnectionId != -1) ? <h1>Estado de Conexion</h1> : <></>}
            {(selectedConnectionId != -1) ? ((isPoolConnected) ? <h1>Conectado</h1> : <div className="flex flex-row gap-y-1"><h1>Desconectado</h1> <Button action={() => { connect() }} id={`connect-${selectedConnectionId}`} text="Conectar" variant='primary' /> </div>) : <></>}
            <br />
            {(!selectedConnectionInfo) ? (<h1>Selecciona una conexion</h1>) : <h1>{selectedConnectionInfo.user}@{selectedConnectionInfo.host}:{selectedConnectionInfo.port}</h1>}
          </div>
        </div>

        {(isPoolConnected) ? (
          <div className='flex flex-row gap-x-2'>
            <Button action={() => { setIsCreateTableModalOpen(true) }} id='create-table' text='Crear Tabla' variant='primary' />
          </div>
        ) : <></>}

        {/* Sección de consultas */}
        <div className='flex flex-col h-2/5 absolute overflow-x-hidden bottom-2 border-t w-10/12 bg-pale'>
          <div className='flex flex-row align-middle mt-4 ml-2 gap-x-4 mb-2'>
            <label htmlFor="query-dropdown" className="block mb-2 text-lg">Seleccionar Consulta</label>
            <select
              id="query-dropdown"
              className="border border-gray-300 p-2"

              value={selectedQuery}
              onChange={(e) => setSelectedQuery(e.target.value)}
            >
              <option value="tables">Listar Tablas</option>
              <option value="pk">Listar Llaves Primarias</option>
              <option value="fk">Listar Llaves Foráneas</option>
              <option value="indices">Listar Índices</option>
              <option value="procedures">Listar Store Procedures</option>
              <option value="triggers">Listar Triggers</option>
              <option value="views">Listar Vistas</option>
              <option value="checks">Listar Checks</option>
            </select>
          </div>

          <div className="overflow-y-scroll w-fit">
            <DataTable headers={queryHeaders} data={queryData} />
          </div>
        </div>
      </main>
    </div>
  )
}
