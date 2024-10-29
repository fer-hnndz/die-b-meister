"use client"

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ConnectionInfo {
    id: number;
    host: string;
    user: string;
    port: number;
    database: string;
}

export default function CreateViewPage() {
    const params = useParams<{ poolId: string }>();
    const poolId = parseInt(params.poolId);
    const router = useRouter();

    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [viewName, setViewName] = useState<string>("");
    const [viewQuery, setViewQuery] = useState<string>("");
    const [tables, setTables] = useState<string[]>([]);
    const [tableName, setTableName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Obtener información de conexión y tablas disponibles
        const fetchConnectionInfo = async () => {
            try {
                const response = await fetch(`http://localhost:3001/pool/get/${poolId}`);
                if (!response.ok) throw new Error("Error al obtener la información de conexión.");
                const data = await response.json();
                setConnectionInfo(data);

                // Obtener lista de tablas
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

    const generateViewQuery = (): string => {
        if (!viewName || !viewQuery) return "";
        return `CREATE VIEW ${viewName} AS ${viewQuery};`;
    };

    const handleCreateView = async () => {
        if (!viewName || !viewQuery) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const res = await fetch(`http://localhost:3001/connection/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poolId,
                sqlQuery: generateViewQuery(),
            }),
        });

        if (res.ok) {
            alert("Vista creada exitosamente.");
            router.push("/");
        } else {
            alert("Error al crear la vista.");
        }
    };

    if (loading) return <div>Cargando información de conexión...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Crear Vista (MariaDB)</h1>
            <p className="text-sm mb-4">
                Conectado a: <b>{connectionInfo?.database}</b> - {connectionInfo?.user}@{connectionInfo?.host}:{connectionInfo?.port}
            </p>

            <label className="block text-sm font-medium mb-2">Nombre de la Tabla (opcional)</label>
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

            <label className="block text-sm font-medium mt-4">Nombre de la Vista</label>
            <input
                type="text"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                className="mt-1 p-2 w-full border rounded"
            />

            <label className="block text-sm font-medium mt-4">Consulta SQL para la Vista</label>
            <textarea
                value={viewQuery}
                onChange={(e) => setViewQuery(e.target.value)}
                placeholder="Escribe aquí la consulta SQL para crear la vista..."
                className="mt-1 p-2 w-full border rounded h-32"
            />

            <div className="mt-6">
                <h3 className="text-lg font-medium">Consulta SQL Generada</h3>
                <pre className="p-3 bg-gray-100 rounded mt-2 whitespace-pre-wrap text-sm">
                    {generateViewQuery()}
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
                    onClick={handleCreateView}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Crear Vista
                </button>
            </div>
        </div>
    );
}
