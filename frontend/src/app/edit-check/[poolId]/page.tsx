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

interface CheckConstraint {
    name: string;
    condition: string;
}

export default function EditCheckPage() {
    const params = useParams<{ poolId: string }>();
    const poolId = parseInt(params.poolId);
    const router = useRouter();

    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [tablesList, setTablesList] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>("");
    const [checksList, setChecksList] = useState<CheckConstraint[]>([]);
    const [selectedCheck, setSelectedCheck] = useState<CheckConstraint | null>(null);
    const [newCheckCondition, setNewCheckCondition] = useState<string>("");
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

    const fetchCheckConstraints = async () => {
        if (!selectedTable) return;
        setLoading(true);
        try {
            // Aquí obtendremos los CHECKs específicos de MariaDB (puede depender del sistema)
            const checksRes = await fetch(`http://localhost:3001/connection/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    poolId: poolId,
                    sqlQuery: `SHOW CREATE TABLE ${selectedTable};`,
                }),
            });

            if (!checksRes.ok) throw new Error("Error al obtener la lista de checks.");
            const checksData = await checksRes.json();
            const checks = parseCheckConstraints(checksData[0]["Create Table"]);
            setChecksList(checks);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const parseCheckConstraints = (createTableSQL: string) => {
        const checkRegex = /CONSTRAINT `(.+?)` CHECK \((.+?)\)/g;
        const checks = [];
        let match;
        while ((match = checkRegex.exec(createTableSQL)) !== null) {
            checks.push({ name: match[1], condition: match[2] });
        }
        return checks;
    };

    useEffect(() => {
        if (selectedTable) fetchCheckConstraints();
    }, [selectedTable]);

    useEffect(() => {
        if (selectedCheck) {
            setNewCheckCondition(selectedCheck.condition);
        }
    }, [selectedCheck]);

    const handleEditCheck = async () => {
        if (!selectedTable || !selectedCheck || !newCheckCondition) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const sql = `
            ALTER TABLE ${selectedTable}
            DROP CONSTRAINT ${selectedCheck.name},
            ADD CONSTRAINT ${selectedCheck.name} CHECK (${newCheckCondition});
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
            alert("CHECK editado exitosamente.");
            router.push("/");
        } else {
            alert("Error al editar el CHECK.");
        }
    };

    const generateCheckSQL = () => {
        if (!selectedTable || !selectedCheck || !newCheckCondition) {
            setPreviewSQL("");
            return;
        }

        const sql = `
            ALTER TABLE ${selectedTable}
            DROP CONSTRAINT ${selectedCheck.name},
            ADD CONSTRAINT ${selectedCheck.name} CHECK (${newCheckCondition});
        `;
        setPreviewSQL(sql);
    };

    useEffect(() => {
        generateCheckSQL();
    }, [selectedTable, selectedCheck, newCheckCondition]);

    if (loading) return <div>Cargando información de conexión...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Editar CHECK (MariaDB)</h1>
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

            {checksList.length > 0 && (
                <>
                    <label className="block text-sm font-medium mt-4">Selecciona un CHECK</label>
                    <select
                        value={selectedCheck?.name || ""}
                        onChange={(e) =>
                            setSelectedCheck(
                                checksList.find((check) => check.name === e.target.value) || null
                            )
                        }
                        className="mt-1 p-2 w-full border rounded"
                    >
                        <option value="">Selecciona un CHECK</option>
                        {checksList.map((check) => (
                            <option key={check.name} value={check.name}>
                                {check.name} - {check.condition}
                            </option>
                        ))}
                    </select>
                </>
            )}

            {selectedCheck && (
                <>
                    <label className="block text-sm font-medium mt-4">Nueva Condición del CHECK</label>
                    <textarea
                        value={newCheckCondition}
                        onChange={(e) => setNewCheckCondition(e.target.value)}
                        placeholder="Escribe aquí la nueva condición del CHECK..."
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
                            onClick={handleEditCheck}
                            className="px-4 py-2 bg-green-500 text-white rounded"
                        >
                            Editar CHECK
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
