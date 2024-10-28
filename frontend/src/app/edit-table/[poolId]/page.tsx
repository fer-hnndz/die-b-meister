"use client"

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Column {
    name: string;
    type: string;
    primaryKey: boolean;
    defaultValue: string;
    nullable: boolean;
    new: boolean;
}

interface ConnectionInfo {
    id: number;
    host: string;
    user: string;
    port: number;
    database: string;
}

export default function EditTablePage({ params }: { params: Promise<{ poolId: string, tableName: string }> }) {
    const router = useRouter()

    const { poolId } = useParams<{ poolId: string }>();
    const [tableName, setTableName] = useState<string>("");
    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [tables, setTables] = useState<string[]>([]); // Lista de tablas
    const [columns, setColumns] = useState<Column[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetchea el schema de la DB actual.
    useEffect(() => {
        async function getSchema() {

            const connInfoRes = await fetch(`http://localhost:3001/pool/get/${poolId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const selectedConnectionInfo = await connInfoRes.json();
            setConnectionInfo(selectedConnectionInfo);

            const tablesRes = await fetch(`http://localhost:3001/connection/execute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    poolId: parseInt(poolId),
                    sqlQuery: `SHOW TABLES FROM ${selectedConnectionInfo.database};`,
                }),
            });

            if (!tablesRes.ok) {
                alert("Error al obtener la lista de tablas.");
                router.replace("/")
                return;
            }

            const tablesData = await tablesRes.json();
            const tablesList = tablesData.map((row) => row[`Tables_in_${selectedConnectionInfo.database}`]);
            setTables(tablesList);
            setIsLoading(false);
        }

        getSchema();
    }, []);

    // Actualiza las columnas al seleccionar una tabla
    const fetchColumns = async (selectedTable: string) => {
        setIsLoading(true);

        const res = await fetch(`http://localhost:3001/connection/execute`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                poolId: parseInt(poolId),
                sqlQuery: `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, TABLE_NAME FROM information_schema.columns WHERE table_schema = '${connectionInfo?.database}' AND table_name = '${selectedTable}'`,
            }),
        });

        if (!res.ok) {
            alert("Error al obtener el esquema de la tabla. Asegurate de estar conectado.");
            router.replace("/")
            return;
        }

        const data = await res.json();
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
                    return 'DECIMAL';
                default:
                    return 'UNKNOWN';
            }
        };

        const columnsObj = data.map((row) => ({
            name: row.COLUMN_NAME,
            type: mapDataType(row.DATA_TYPE),
            isNullable: row.IS_NULLABLE === 'YES',
            defaultValue: row.COLUMN_DEFAULT ? row.COLUMN_DEFAULT.replace(/'/g, "") : null,
            tableName: row.TABLE_NAME,
            new: false,
        }));

        setColumns(columnsObj);
        setTableName(selectedTable);
        setIsLoading(false);
    };

    // Manejar cambios en las columnas
    const handleColumnChange = (index: number, field: keyof Column, value: string | boolean) => {
        setColumns((prevColumns) => {
            const newColumns = [...prevColumns];
            newColumns[index] = { ...newColumns[index], [field]: value };
            return newColumns;
        });
    };

    // Agregar una nueva columna
    const handleAddColumn = () => {
        setColumns([
            ...columns,
            { name: "", type: "VARCHAR(255)", primaryKey: false, defaultValue: "", nullable: true, new: true },
        ]);
    };

    // Generar consulta SQL para actualizar la tabla
    const generateQuery = (): string => {

        console.log(columns);

        const primaryKeys = columns
            .filter((col) => col.primaryKey)
            .map((col) => col.name)
            .join(", ");

        const columnDefinitions = columns.map((col) => {
            let def = col.new ? `ADD COLUMN ${col.name} ${col.type}` : `MODIFY COLUMN ${col.name} ${col.type}`;

            if (col.defaultValue) {
                if (col.type === "BOOLEAN" || col.type === "INT") def += ` DEFAULT ${col.defaultValue.replace}`;
                else def += ` DEFAULT '${col.defaultValue}'`;
            }

            if (col.nullable) def += " NULL";
            else def += " NOT NULL";

            return def;
        });

        let query = `ALTER TABLE ${tableName}\n  ${columnDefinitions.join(",\n  ")}`;
        if (primaryKeys) query += `,\n  ADD PRIMARY KEY (${primaryKeys})`;
        query += ";";

        return query;
    };


    async function handleSaveChanges() {
        const query = generateQuery();

        // Ejecutar la consulta
        const res = await fetch("http://localhost:3001/connection/execute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                poolId: parseInt(poolId),
                sqlQuery: query,
            }),
        });

        if (!res.ok) {
            alert("Error al ejecutar la consulta.");
            return;
        }

        alert("Cambios guardados correctamente.");
        router.replace("/");
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-4">Editar Tabla: {tableName}</h1>
            <h2 className="text-lg font-medium mb-2">Conexión:</h2>
            <pre className="p-2 bg-gray-100 rounded mb-4"><b>{connectionInfo?.database}</b> | {connectionInfo?.user}@{connectionInfo?.host}:{connectionInfo?.port}</pre>

            {/* Dropdown de selección de tabla */}
            <label className="block text-sm mb-2">Selecciona una tabla</label>
            <select
                value={tableName}
                onChange={(e) => fetchColumns(e.target.value)}
                className="mt-1 p-2 w-full border rounded mb-4"
            >
                <option value="">Seleccione una tabla...</option>
                {tables.map((table, index) => (
                    <option key={index} value={table}>
                        {table}
                    </option>
                ))}
            </select>

            <h3 className="text-lg font-medium mt-4">Columnas</h3>
            {columns.map((col, index) => (
                <div key={index} className="border-b border-gray-300 mb-3 pb-3">
                    <label className="block text-sm">
                        Nombre de la Columna
                        <input
                            type="text"
                            value={col.name || ""}
                            onChange={(e) => handleColumnChange(index, "name", e.target.value)}
                            className="mt-1 p-2 w-full border rounded disabled:bg-pale disabled:italic hover:cursor-not-allowed"
                            disabled={!col.new}
                        />
                    </label>

                    <label className="block text-sm mt-2">
                        Tipo de Dato
                        <select
                            value={col.type}
                            onChange={(e) => handleColumnChange(index, "type", e.target.value)}
                            className="mt-1 p-2 w-full border rounded bg-white"
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
                            value={col.defaultValue || ""}
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

            <div className="mt-6">
                <h3 className="text-lg font-medium">Consulta SQL Generada</h3>
                <pre className="p-3 bg-gray-100 rounded mt-2 whitespace-pre-wrap text-sm">
                    {generateQuery()}
                </pre>
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
}
