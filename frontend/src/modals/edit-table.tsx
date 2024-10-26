import React, { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

interface Column {
    name: string;
    type: string;
    isNullable: boolean;
    defaultValue: string | null;
    tableName: string; // Asegúrate de tener el nombre de la tabla en cada columna
}

interface EditTableModalProps {
    isOpen: boolean;
    onClose: (query: string) => void;
    columnsData: Column[];
}

const mapDataType = (dataType: string) => {
    switch (dataType.toUpperCase()) {
        case 'INT':
            return 'INT';
        case 'BOOLEAN':
            return 'BOOLEAN';
        case 'VARCHAR(200)':
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

export default function EditTableModal({ isOpen, onClose, columnsData }: EditTableModalProps) {
    const [tableName, setTableName] = useState<string>("Persona");
    const [columns, setColumns] = useState<Column[]>([]);
    const [uniqueTables, setUniqueTables] = useState<string[]>([]);

    // Obtener nombres únicos de tablas
    useEffect(() => {
        const tables = Array.from(new Set(columnsData.map((col) => col.tableName)));
        setUniqueTables(tables);
    }, [columnsData]);

    // Actualizar columnas cuando cambia el nombre de la tabla seleccionada
    useEffect(() => {
        const filteredColumns = columnsData.filter((col) => col.tableName === tableName);
        setColumns(filteredColumns);
    }, [tableName, columnsData]);

    const handleColumnChange = (index: number, field: keyof Column, value: any) => {
        const newColumns = [...columns];
        newColumns[index][field] = value;
        setColumns(newColumns);
    };

    const generateQuery = (): string => {
        const columnDefinitions = columns.map((col) => {
            let def = `MODIFY COLUMN ${col.name} ${mapDataType(col.type)}`;
            if (col.defaultValue) def += ` DEFAULT '${col.defaultValue}'`;
            def += col.isNullable ? " NULL" : " NOT NULL";
            return def;
        });

        let query = `ALTER TABLE ${tableName}\n  ${columnDefinitions.join(",\n  ")};`;
        return query;
    };
    return (
        <Dialog open={isOpen} onClose={() => onClose("")} className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <DialogPanel className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                    <DialogTitle className="text-xl font-semibold mb-4">Editar Tabla (MariaDB)</DialogTitle>

                    <label className="block text-sm font-medium mb-2">
                        Nombre de la Tabla
                        <select
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            className="mt-1 p-2 w-full border rounded bg-gray-100 text-gray-700 focus:outline-none focus:border-blue-500"
                        >
                            {uniqueTables.map((table, index) => (
                                <option key={index} value={table}>{table}</option>
                            ))}
                        </select>
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
                                        <option value="INT">INT</option>
                                        <option value="BOOLEAN">BOOLEAN</option>
                                        <option value="VARCHAR(200)">VARCHAR(200)</option>
                                        <option value="DATETIME">DATETIME</option>
                                        <option value="DECIMAL">DECIMAL</option>
                                    </select>
                                </label>

                                <label className="block text-sm mt-2 flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={col.isNullable}
                                        onChange={(e) => handleColumnChange(index, "isNullable", e.target.checked)}
                                        className="mr-2"
                                    />
                                    Aceptar NULL
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
                            </div>
                        ))}
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-medium">Consulta SQL Generada</h3>
                        <pre className="p-3 bg-gray-100 rounded mt-2 whitespace-pre-wrap text-sm">
                            {generateQuery()}
                        </pre>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => {
                                setColumns(columnsData); // Reset columns to original data
                                onClose(""); // Close modal without query
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded mr-2"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onClose(generateQuery())}
                            className="px-4 py-2 bg-green-500 text-white rounded"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
