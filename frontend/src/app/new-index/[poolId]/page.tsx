"use client"

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Column {
    name: string;
    type: string;
}

interface ConnectionInfo {
    id: number;
    host: string;
    user: string;
    port: number;
    database: string;
}

export default function CreateIndexPage() {
    const params = useParams<{ poolId: string }>();
    const poolId = parseInt(params.poolId);
    const router = useRouter();

    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [indexType, setIndexType] = useState<"INDEX" | "UNIQUE">("INDEX");
    const [indexName, setIndexName] = useState<string>("");
    const [indexColumns, setIndexColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tableName, setTableName] = useState<string>("");
    const [tables, setTables] = useState<string[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);

    useEffect(() => {
        const fetchConnectionInfo = async () => {
            try {
                const response = await fetch(`http://localhost:3001/pool/get/${poolId}`);
                if (!response.ok) throw new Error("Error al obtener la información de conexión.");
                const data = await response.json();
                setConnectionInfo(data);

                const tablesRes = await fetch(`http://localhost:3001/connection/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        poolId: poolId,
                        sqlQuery: `SHOW TABLES FROM ${data.database};`,
                    }),
                });

                if (!tablesRes.ok) throw new Error("Error al obtener la lista de tablas.");

                const tablesData = await tablesRes.json();
                const tablesList = tablesData.map((row: any) => row[`Tables_in_${data.database}`]);
                setTables(tablesList);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConnectionInfo();
    }, [poolId]);

    useEffect(() => {
        if (!tableName) return;

        const fetchColumns = async () => {
            const res = await fetch(`http://localhost:3001/connection/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    poolId,
                    sqlQuery: `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.columns WHERE table_schema = '${connectionInfo?.database}' AND table_name = '${tableName}'`,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                const columnsObj = data.map((row: any) => ({
                    name: row.COLUMN_NAME,
                    type: row.DATA_TYPE,
                }));
                setColumns(columnsObj);
            } else {
                alert("Error al obtener las columnas de la tabla.");
            }
        };

        fetchColumns();
    }, [tableName, connectionInfo]);

    const toggleColumnSelection = (columnName: string) => {
        setIndexColumns((prev) =>
            prev.includes(columnName) ? prev.filter((col) => col !== columnName) : [...prev, columnName]
        );
    };

    const generateIndexQuery = (): string => {
        if (!tableName || indexColumns.length === 0 || !indexName) return "";
        return `CREATE ${indexType === "INDEX" ? "INDEX" : "UNIQUE INDEX"} ${indexName} ON ${tableName} (${indexColumns.join(", ")});`;
    };

    const handleCreateIndex = async () => {
        if (!tableName || indexColumns.length === 0 || !indexName) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const res = await fetch(`http://localhost:3001/connection/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poolId,
                sqlQuery: generateIndexQuery(),
            }),
        });

        if (res.ok) {
            alert("Índice creado exitosamente.");
            router.push("/");
        } else {
            alert("Error al crear el índice.");
        }
    };

    if (loading) return <div>Cargando información de conexión...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Crear Índice (MariaDB)</h1>
            <p className="text-sm mb-4">
                Conectado a: <b>{connectionInfo?.database}</b> - {connectionInfo?.user}@{connectionInfo?.host}:{connectionInfo?.port}
            </p>

            <label className="block text-sm font-medium mb-2">Nombre de la Tabla</label>
            <select
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="mt-1 p-2 w-full border rounded"
            >
                <option value="">Selecciona una tabla</option>
                {tables.map((table) => (
                    <option key={table} value={table}>
                        {table}
                    </option>
                ))}
            </select>

            {columns.length > 0 && (
                <>
                    <label className="block text-sm font-medium mt-4">Selecciona Columna(s)</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {columns.map((col) => (
                            <div key={col.name} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={indexColumns.includes(col.name)}
                                    onChange={() => toggleColumnSelection(col.name)}
                                    className="mr-2"
                                />
                                <label>{col.name} ({col.type})</label>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <label className="block text-sm font-medium mt-4">Tipo de Índice</label>
            <select
                value={indexType}
                onChange={(e) => setIndexType(e.target.value as "INDEX" | "UNIQUE")}
                className="mt-1 p-2 w-full border rounded"
            >
                <option value="INDEX">INDEX</option>
                <option value="UNIQUE">UNIQUE</option>
            </select>

            <label className="block text-sm font-medium mt-4">Nombre del Índice</label>
            <input
                type="text"
                value={indexName}
                onChange={(e) => setIndexName(e.target.value)}
                className="mt-1 p-2 w-full border rounded"
            />

            <div className="mt-6">
                <h3 className="text-lg font-medium">Consulta SQL Generada</h3>
                <pre className="p-3 bg-gray-100 rounded mt-2 whitespace-pre-wrap text-sm">
                    {generateIndexQuery()}
                </pre>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 bg-red-500 text-white rounded mr-2"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleCreateIndex}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Crear Índice
                </button>
            </div>
        </div>
    );
}
