"use client"

import React, { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";

interface Column {
    name: string;
    type: string;
    primaryKey: boolean;
    defaultValue: string;
    nullable: boolean;
}

interface ConnectionInfo {
    id: number;
    host: string;
    user: string;
    port: number;
    database: string;
}

interface CreateTablePageParams {
    params: {
        poolIdString: string;
    }
}

export default function CreateTablePage() {
    const params = useParams<{ poolId: string }>();
    const poolId = parseInt(params.poolId);

    const router = useRouter();
    const initialColumnState: Column[] = [
        { name: "", type: "VARCHAR(255)", primaryKey: false, defaultValue: "", nullable: true },
    ];

    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tableName, setTableName] = useState<string>("");
    const [columns, setColumns] = useState<Column[]>(initialColumnState);

    useEffect(() => {
        // Realizar fetch de la información de conexión usando poolId
        const fetchConnectionInfo = async () => {
            try {
                console.log(poolId)
                const response = await fetch(`http://localhost:3001/pool/get/${poolId}`);
                if (!response.ok) {
                    throw new Error("Error al obtener la información de conexión.");
                }
                const data = await response.json();
                setConnectionInfo(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConnectionInfo();
    }, [poolId]);

    const handleAddColumn = () => {
        setColumns([
            ...columns,
            { name: "", type: "VARCHAR(255)", primaryKey: false, defaultValue: "", nullable: true },
        ]);
    };

    const handleColumnChange = (index: number, field: keyof Column, value: string | boolean) => {
        setColumns((prevColumns) => {
            const newColumns = [...prevColumns];
            newColumns[index] = { ...newColumns[index], [field]: value };
            return newColumns;
        });
    };


    const generateQuery = (): string => {
        if (!tableName) return "";

        const primaryKeys = columns
            .filter((col) => col.primaryKey)
            .map((col) => col.name)
            .join(", ");
        const columnDefinitions = columns.map((col) => {
            let def = `${col.name} ${col.type}`;
            if (col.defaultValue) {
                def += col.type === "BOOLEAN" || col.type === "INT"
                    ? ` DEFAULT ${col.defaultValue}`
                    : ` DEFAULT '${col.defaultValue}'`;
            }
            def += col.nullable ? " NULL" : " NOT NULL";
            return def;
        });
        let query = `CREATE TABLE ${tableName} (\n  ${columnDefinitions.join(",\n  ")}`;
        if (primaryKeys) query += `,\n  PRIMARY KEY (${primaryKeys})`;
        query += "\n);";
        return query;
    };

    const resetForm = () => {
        setTableName("");
        setColumns(initialColumnState);
    };

    const handleCancel = () => {
        resetForm();
        router.push("/");
    };

    const handleCreateTable = () => {
        if (!tableName) {
            alert("Por favor, ingresa un nombre para la tabla.");
            return;
        }

        // Revisar que no existan columnas sin nombre
        if (columns.some((col) => !col.name)) {
            alert("Por favor, ingresa un nombre para todas las columnas.");
            return;
        }

        const query = generateQuery();
        console.log("SQL Query:", query);
        // Aquí podrías implementar la lógica para ejecutar la consulta usando `connectionInfo`
        resetForm();
    };

    if (loading) {
        return <div>Cargando información de conexión...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Crear Tabla (MariaDB)</h1>
            <p className="text-sm mb-4">
                Conectado a: <b>{connectionInfo?.database}</b> - {connectionInfo?.user}@{connectionInfo?.host}:{connectionInfo?.port}
            </p>

            <label className="block text-sm font-medium mb-2">
                Nombre de la Tabla
                <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="mt-1 p-2 w-full border rounded"
                />
            </label>

            <div>
                <h3 className="text-lg font-medium mt-4">Columnas</h3>
                {columns.map((col, index) => (
                    <div key={index} className="border-b border-gray-300 mb-3 pb-3">
                        <label className="block text-sm">
                            Nombre de la Columna
                            <input
                                type="text"
                                value={col.name}
                                onChange={(e) => handleColumnChange(index, "name", e.target.value)}
                                className="mt-1 p-2 w-full border rounded"
                            />
                        </label>

                        <label className="block text-sm mt-2">
                            Tipo de Dato
                            <select
                                value={col.type}
                                onChange={(e) => handleColumnChange(index, "type", e.target.value)}
                                className="mt-1 p-2 w-full border rounded"
                            >
                                <option>VARCHAR(255)</option>
                                <option>INT</option>
                                <option>BOOLEAN</option>
                                <option>DATE</option>
                            </select>
                        </label>

                        <label className="block text-sm mt-2 flex items-center">
                            <input
                                type="checkbox"
                                checked={col.primaryKey}
                                onChange={(e) => handleColumnChange(index, "primaryKey", e.target.checked)}
                                className="mr-2"
                            />
                            Clave Primaria
                        </label>

                        <label className="block text-sm mt-2">
                            Valor por Defecto
                            <input
                                type="text"
                                value={col.defaultValue}
                                onChange={(e) => handleColumnChange(index, "defaultValue", e.target.value)}
                                className="mt-1 p-2 w-full border rounded"
                            />
                        </label>

                        <label className="block text-sm mt-2 flex items-center">
                            <input
                                type="checkbox"
                                checked={col.nullable}
                                onChange={(e) => handleColumnChange(index, "nullable", e.target.checked)}
                                className="mr-2"
                            />
                            Acepta Nulos
                        </label>
                    </div>
                ))}

                <button
                    onClick={handleAddColumn}
                    className="mt-3 px-3 py-2 bg-blue-500 text-white rounded"
                >
                    Agregar Columna
                </button>
            </div>

            <div className="mt-6">
                <h3 className="text-lg font-medium">Consulta SQL Generada</h3>
                <pre className="p-3 bg-gray-100 rounded mt-2 whitespace-pre-wrap text-sm">
                    {generateQuery()}
                </pre>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-red-500 text-white rounded mr-2"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleCreateTable}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Crear Tabla
                </button>
            </div>
        </div>
    );
}
