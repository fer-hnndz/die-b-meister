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

export default function CreateTriggerPage() {
    const params = useParams<{ poolId: string }>();
    const poolId = parseInt(params.poolId);
    const router = useRouter();

    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [triggerName, setTriggerName] = useState<string>("");
    const [table, setTable] = useState<string>("");
    const [tablesList, setTablesList] = useState<string[]>([]);
    const [triggerBody, setTriggerBody] = useState<string>("");
    const [triggerTiming, setTriggerTiming] = useState<"BEFORE" | "AFTER">("BEFORE");
    const [triggerEvent, setTriggerEvent] = useState<"INSERT" | "UPDATE" | "DELETE">("INSERT");
    const [error, setError] = useState<string | null>(null);
    const [previewSQL, setPreviewSQL] = useState<string>("");

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
                const tableNames = tablesData.map((row: any) => row[`Tables_in_${data.database}`]);
                setTablesList(tableNames);
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchConnectionInfo();
    }, []);

    const handleCreateTrigger = async () => {
        if (!triggerName || !table || !triggerBody) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const sql = `
            CREATE TRIGGER ${triggerName} ${triggerTiming} ${triggerEvent} ON ${table}
            FOR EACH ROW
            ${triggerBody};
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
            alert("Trigger creado exitosamente.");
            router.push("/");
        } else {
            alert("Error al crear el trigger.");
        }
    };

    if (error) return <div>Error: {error}</div>;

    const generateTriggerSQL = () => {
        if (!triggerName || !table || !triggerBody) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const sql = `
            CREATE TRIGGER ${triggerName} ${triggerTiming} ${triggerEvent} ON ${table}
            FOR EACH ROW
            ${triggerBody};
        `;
        setPreviewSQL(sql);
    };

    useEffect(() => {
        if (!triggerName || !table || !triggerBody) return;

        const sql = `
            CREATE TRIGGER ${triggerName} ${triggerTiming} ${triggerEvent} ON ${table}
            FOR EACH ROW
            ${triggerBody};
        `;
        setPreviewSQL(sql);
    }, [triggerBody]);


    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Crear Trigger (MariaDB)</h1>
            <p className="text-sm mb-4">
                Conectado a: <b>{connectionInfo?.database}</b> - {connectionInfo?.user}@{connectionInfo?.host}:{connectionInfo?.port}
            </p>

            <label className="block text-sm font-medium mb-2">Nombre del Trigger</label>
            <input
                type="text"
                value={triggerName}
                onChange={(e) => setTriggerName(e.target.value)}
                placeholder="Nombre del trigger"
                className="mt-1 p-2 w-full border rounded"
            />

            <label className="block text-sm font-medium mt-4">Tabla</label>
            <select
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className="mt-1 p-2 w-full border rounded"
            >
                <option value="">Selecciona una tabla</option>
                {tablesList.map((tableName) => (
                    <option key={tableName} value={tableName}>
                        {tableName}
                    </option>
                ))}
            </select>

            <label className="block text-sm font-medium mt-4">Momento de Ejecución</label>
            <select
                value={triggerTiming}
                onChange={(e) => setTriggerTiming(e.target.value as "BEFORE" | "AFTER")}
                className="mt-1 p-2 w-full border rounded"
            >
                <option value="BEFORE">BEFORE</option>
                <option value="AFTER">AFTER</option>
            </select>

            <label className="block text-sm font-medium mt-4">Evento</label>
            <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value as "INSERT" | "UPDATE" | "DELETE")}
                className="mt-1 p-2 w-full border rounded"
            >
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
            </select>

            <label className="block text-sm font-medium mt-4">Cuerpo del Trigger</label>
            <textarea
                value={triggerBody}
                onChange={(e) => setTriggerBody(e.target.value)}
                placeholder="Escribe aquí el cuerpo del trigger..."
                className="mt-1 p-2 w-full border rounded h-32"
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
                    onClick={handleCreateTrigger}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Crear Trigger
                </button>
            </div>
        </div>
    );
}
