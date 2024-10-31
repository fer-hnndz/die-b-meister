"use client"

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/sidebar'
import NewConnectionPopup from '../modals/new-connection-popup'
import { PoolData } from '../interfaces'
import Button from '../components/Button';
import DataTable from '@/components/DataTable'
import CreateTableModal from '@/modals/new-table'
import { useRouter } from 'next/navigation'

const URL = 'http://localhost:3001'

export default function Dashboard() {
  // Storage of pools (connections for the user)
  const [pools, setPools] = useState<PoolData[]>([])

  // Modals
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState<boolean>(false);
  const [isEditTableModalOpen, setIsEditTableModalOpen] = useState<boolean>(false);

  // Store queries/actions for the connection
  const [selectedQuery, setSelectedQuery] = useState<string>('tables')
  const [queryHeaders, setQueryHeaders] = useState<string[]>([]);
  const [queryData, setQueryData] = useState<string[]>([]);

  // Connection storage
  const [selectedConnectionId, setSelectedConnectionId] = useState<number>(-1); // Para almacenar la conexión seleccionada
  const [selectedConnectionInfo, setSelectedConnectionInfo] = useState<PoolData | null>(null);
  const [isPoolConnected, setIsPoolConnected] = useState<boolean>(false);
  const [connectionSchema, setConnectionSchema] = useState<string[]>([]);

  const [selectedActionType, setSelectedActionType] = useState('table');

  const actionTypes = [
    { value: 'table', label: 'Tabla' },
    { value: 'function', label: 'Función/Store Procedure' },
    { value: 'index', label: 'Índice' },
    { value: 'trigger', label: 'Trigger' },
    { value: 'check', label: 'Check' },
    { value: 'view', label: 'Vista' },
  ];

  const router = useRouter();
  // Funcion que utiliza el popup para crear una nueva conexión
  // Esta accede a la API para guardar las creds (excepto la pass) 
  // para enlistar las conexiones creadas.
  async function createPool(host: string, port: string, user: string, db: string, pass: string) {
    let poolId = 0
    try {
      const response = await fetch(`${URL}/pool/create`, {
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
      const res = await fetch(`${URL}/connection/create`, {
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
      const res = await fetch(`${URL}/connection/create`, {
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

      if (selectedConnectionId === -1) return;
      console.log("Fetching connection info...");
      const res = await fetch(`${URL}/pool/get`, { method: "GET" })

      const data = await res.json();
      setSelectedConnectionInfo(data.find((pool: PoolData) => pool.id === selectedConnectionId));

      const res2 = await fetch(`${URL}/connection/isConnected?poolId=${selectedConnectionId}`, { method: "GET" });
      if (!res2.ok) setIsPoolConnected(false);

      const data2 = await res2.json();
      setIsPoolConnected(data2.isConnected);
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

    const res = await fetch(`${URL}/connection/retrieve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        poolId,
        query,
        dbName: selectedConnectionInfo?.database,
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
    setQueryHeaders(data.headers);
    setQueryData(data.data)
  }, [selectedQuery, selectedConnectionId, isPoolConnected, selectedConnectionInfo])

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
  *****************
  Callback que fetchea el schema de la conexion.
  *****************
  */
  const fetchConnTables = useCallback(async () => {
    if (!isPoolConnected) return []

    const res = await fetch(`${URL}/connection/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        poolId: selectedConnectionId,
        sqlQuery: `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, TABLE_NAME FROM information_schema.columns WHERE table_schema = '${selectedConnectionInfo?.database}'`,
      }),
    });

    const data = await res.json();
    console.log(data, typeof data)

    // Función para mapear el tipo de dato
    const mapDataType = (dataType: string) => {
      switch (dataType.toUpperCase()) {
        case 'INT':
          return 'INT';
        case 'TINYINT':
        case 'SMALLINT':
        case 'MEDIUMINT':
        case 'BIGINT':
          return 'INT';
        case 'BOOLEAN':
          return 'BOOLEAN';
        case 'VARCHAR':
        case 'CHAR':
        case 'TEXT':
          return 'VARCHAR(200)';
        case 'DATETIME':
          return 'DATETIME';
        case 'DECIMAL':
        case 'DECIMAL(10,2)': // Ejemplo, ajusta según tus necesidades
          return 'DECIMAL';
        default:
          return 'UNKNOWN'; // O alguna opción por defecto
      }
    };


    // Mapeo de resultados a un array
    const columnsObj = data.map((row) => ({
      name: row.COLUMN_NAME,
      type: mapDataType(row.DATA_TYPE),
      isNullable: row.IS_NULLABLE === 'YES',
      defaultValue: row.COLUMN_DEFAULT,
      tableName: row.TABLE_NAME,
    }));

    return columnsObj;
  }, [isPoolConnected, selectedConnectionId, selectedConnectionInfo])

  /*
  ------------------------
  UseEffect que se ejecuta al cambiar la conexión seleccionada para obtener el schema de la conexión.
  ------------------------
  */
  useEffect(() => {
    async function fetchTables() {
      const columns = await fetchConnTables();
      console.log(columns);
      setConnectionSchema(columns)
    }

    fetchTables();
  }, [selectedConnectionInfo, setConnectionSchema, fetchConnTables])

  /*
  ------------------------
  UseEfffect que se ejecuta una vez al cargar la pagina para obtener los pools.
  ------------------------
  */
  useEffect(() => {
    fetch(`${URL}/pool/get`).then(async (response) => {
      if (!response.ok) alert("Error al cargar las conexiones existentes.");
      const data = await response.json();
      console.log(data, typeof data);
      setPools(data);
    })
  }, []);


  return (
    <div className='flex flex-row'>
      <Sidebar pools={pools} onSelectPool={updateSelectedPool} />

      <main className="z-1 text-black pt-2 overflow-x-hidden">
        <div className='float-top w-auto h-fit'>

          <div className="bg-red w-fit h-fit p-4 rounded shadow-md ml-2">
            {(selectedConnectionId != -1) ? <h1>Estado de Conexion</h1> : <></>}
            {(selectedConnectionId != -1) ? ((isPoolConnected) ? <h1>Conectado</h1> : <div className="flex flex-row gap-y-1"><h1>Desconectado</h1> <Button action={() => { connect() }} id={`connect - ${selectedConnectionId}`} text="Conectar" variant='primary' /> </div>) : <></>}
            <br />
            {(!selectedConnectionInfo) ? (<h1>Selecciona una conexion</h1>) : <h1>{selectedConnectionInfo.user}@{selectedConnectionInfo.host}:{selectedConnectionInfo.port}</h1>}
          </div>
        </div>

        <label htmlFor="action-type" className="mr-2">Seleccionar Tipo de Acción:</label>
        <select
          id="action-type"
          className="border border-gray-300 p-2"
          value={selectedActionType}
          onChange={(e) => setSelectedActionType(e.target.value)}
        >
          {actionTypes.map((action) => (
            <option key={action.value} value={action.value}>
              {action.label}
            </option>
          ))}
        </select>

        {(isPoolConnected) && (
          <div className='flex flex-row gap-x-2 mt-4'>
            {selectedActionType === 'table' && (
              <>
                <Button action={() => { router.push(`/new-table/${selectedConnectionInfo?.id}`) }} id='create-table' text='Crear Tabla' variant='primary' />
                <Button action={() => { router.push(`/edit-table/${selectedConnectionInfo?.id}`) }} id='edit-table' text='Editar Tabla' variant='warning' />
                <Button action={() => { router.push(`/delete-table/${selectedConnectionInfo?.id}`) }} id='delete-table' text='Borrar Tabla' variant='danger' />
              </>
            )}
            {selectedActionType === 'function' && (
              <>
                <Button action={() => { router.push(`/new-function/${selectedConnectionInfo?.id}`) }} id='create-function' text='Crear Función/Store Procedure' variant='primary' />
                <Button action={() => { router.push(`/edit-function/${selectedConnectionInfo?.id}`) }} id='edit-function' text='Editar Función/Store Procedure' variant='warning' />
                <Button action={() => { router.push(`/delete-function/${selectedConnectionInfo?.id}`) }} id='delete-function' text='Borrar Función/Store Procedure3' variant='danger' />
              </>
            )}
            {selectedActionType === 'index' && (
              <>
                <Button action={() => { router.push(`/new-index/${selectedConnectionInfo?.id}`) }} id='create-index' text='Crear Índice' variant='primary' />
                <Button action={() => { router.push(`/edit-index/${selectedConnectionInfo?.id}`) }} id='edit-index' text='Editar Índice' variant='warning' />
                <Button action={() => { router.push(`/delete-index/${selectedConnectionInfo?.id}`) }} id='delete-index' text='Borrar Índice' variant='danger' />
              </>
            )}
            {selectedActionType === 'trigger' && (
              <>
                <Button action={() => { router.push(`/new-trigger/${selectedConnectionInfo?.id}`) }} id='create-trigger' text='Crear Trigger' variant='primary' />
                <Button action={() => { router.push(`/edit-trigger/${selectedConnectionInfo?.id}`) }} id='edit-trigger' text='Editar Trigger' variant='warning' />
                <Button action={() => { router.push(`/delete-trigger/${selectedConnectionInfo?.id}`) }} id='delete-trigger' text='Borrar Trigger' variant='danger' />
              </>
            )}
            {selectedActionType === 'check' && (
              <>
                <Button action={() => { router.push(`/new-check/${selectedConnectionInfo?.id}`) }} id='create-check' text='Crear Check' variant='primary' />
                <Button action={() => { router.push(`/edit-check/${selectedConnectionInfo?.id}`) }} id='edit-check' text='Editar Check' variant='warning' />
                <Button action={() => { router.push(`/delete-check/${selectedConnectionInfo?.id}`) }} id='delete-check' text='Borrar Check' variant='danger' />
              </>
            )}
            {selectedActionType === 'view' && (
              <>
                <Button action={() => { router.push(`/new-view/${selectedConnectionInfo?.id}`) }} id='create-view' text='Crear Vista' variant='primary' />
                <Button action={() => { router.push(`/edit-view/${selectedConnectionInfo?.id}`) }} id='edit-view' text='Editar Vista' variant='warning' />
                <Button action={() => { router.push(`/delete-view/${selectedConnectionInfo?.id}`) }} id='delete-view' text='Borrar Vista' variant='danger' />
              </>
            )}
          </div>
        )}


        {/* Sección de consultas */}
        <div className='flex flex-col z-1 h-2/5 sticky top-2/3 w-screen overflow-x-hidden bottom-2 border-t bg-pale'>
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
      <NewConnectionPopup create_connection={createPool} />

    </div>
  )
}
