"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ConnectionInfo {
    id: number;
    host: string;
    user: string;
    port: number;
    database: string;
}

interface Table {
    name: string;
}

export default function CreateCheckPage() {
    const params = useParams<{ poolId: string }>();
    const poolId = parseInt(params.poolId);
    const router = useRouter();

    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [tablesList, setTablesList] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>("");
    const [checkCondition, setCheckCondition] = useState<string>("");
    const [checkName, setCheckName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewSQL, setPreviewSQL] = useState<string>("");

    useEffect(() => {
        const fetchConnectionInfo = async () => {
            setLoading(true);
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
                const tableNames = tablesData.map((row: any) => row[`Tables_in_${data.database}`]);
                setTablesList(tableNames);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConnectionInfo();
    }, [poolId]);

    const handleCreateCheck = async () => {
        if (!selectedTable || !checkCondition || !checkName) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const sql = `
            ALTER TABLE ${selectedTable} 
            ADD CONSTRAINT ${checkName} CHECK (${checkCondition});
        `;

        const res = await fetch(`http://localhost:3001/connection/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poolId,
                sqlQuery: sql,
            }),
        });

        if (res.ok) {
            alert("CHECK creado exitosamente.");
            router.push("/");
        } else {
            alert("Error al crear el CHECK.");
        }
    };

    const generateCheckSQL = () => {
        if (!selectedTable || !checkCondition || !checkName) {
            setPreviewSQL(""); // Limpiar SQL si hay campos vacíos
            return;
        }

        const sql = `
            ALTER TABLE ${selectedTable} 
            ADD CONSTRAINT ${checkName} CHECK (${checkCondition});
        `;
        setPreviewSQL(sql);
    };

    useEffect(() => {
        generateCheckSQL();
    }, [selectedTable, checkCondition, checkName]); // Genera SQL cuando cualquiera de estos cambie

    if (loading) return <div>Cargando información de conexión...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Crear CHECK (MariaDB)</h1>
            <p className="text-sm mb-4">
                Conectado a: <b>{connectionInfo?.database}</b> - {connectionInfo?.user}@{connectionInfo?.host}:{connectionInfo?.port}
            </p>

            <label className="block text-sm font-medium mb-2">Selecciona una Tabla</label>
            <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="mt-1 p-2 w-full border rounded"
            >
                <option value="">Selecciona una tabla</option>
                {tablesList.map((tableName) => (
                    <option key={tableName} value={tableName}>
                        {tableName}
                    </option>
                ))}
            </select>

            <label className="block text-sm font-medium mt-4">Nombre del CHECK</label>
            <input
                type="text"
                value={checkName}
                onChange={(e) => setCheckName(e.target.value)}
                placeholder="Nombre de la restricción CHECK"
                className="mt-1 p-2 w-full border rounded"
            />

            <label className="block text-sm font-medium mt-4">Condición del CHECK</label>
            <textarea
                value={checkCondition}
                onChange={(e) => setCheckCondition(e.target.value)}
                placeholder="Escribe aquí la condición del CHECK (Ejemplo: columna > 0)"
                className="mt-1 p-2 w-full border rounded h-24"
            />

            {previewSQL && (
                <div className="mt-4">
                    <h3 className="text-lg font-medium">SQL Generado:</h3>
                    <pre className="bg-gray-100 p-4 rounded">{previewSQL}</pre>
                </div>
            )}

            <div className="mt-4 flex justify-end">
                <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 bg-red-500 text-white rounded mr-2"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleCreateCheck}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Crear CHECK
                </button>
            </div>
        </div>
    );
}
