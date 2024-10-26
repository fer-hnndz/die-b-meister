import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

interface Column {
    name: string;
    type: string;
    primaryKey: boolean;
    defaultValue: string;
    nullable: boolean;
}

interface CreateTableModalProps {
    isOpen: boolean;
    onClose: (query?: string) => void;
    onCancel: () => void;
}

export default function CreateTableModal({ isOpen, onClose, onCancel }: CreateTableModalProps) {
    const initialColumnState = [
        { name: "", type: "VARCHAR(255)", primaryKey: false, defaultValue: "", nullable: true },
    ];

    const [tableName, setTableName] = useState<string>("");
    const [columns, setColumns] = useState<Column[]>(initialColumnState);

    const handleAddColumn = () => {
        setColumns([
            ...columns,
            { name: "", type: "VARCHAR(255)", primaryKey: false, defaultValue: "", nullable: true },
        ]);
    };

    const handleColumnChange = (index: number, field: keyof Column, value: any) => {
        const newColumns = [...columns];
        newColumns[index][field] = value;
        setColumns(newColumns);
    };

    const generateQuery = (): string => {
        const primaryKeys = columns
            .filter((col) => col.primaryKey)
            .map((col) => col.name)
            .join(", ");

        const columnDefinitions = columns.map((col) => {
            let def = `${col.name} ${col.type}`;
            if (col.defaultValue) {
                if (col.type === "BOOLEAN" || col.type === "INT") def += ` DEFAULT ${col.defaultValue}`;
                else def += ` DEFAULT '${col.defaultValue}'`

            };
            if (col.nullable) def += " NULL";
            else def += " NOT NULL";
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
        onCancel();
    };

    const handleCreateTable = () => {
        const query = generateQuery();
        console.log(query, "from component");
        onClose(query);
        resetForm();
    };

    return (
        <Dialog open={isOpen} onClose={() => { }} className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <DialogPanel className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-lg mx-auto">
                    <DialogTitle className="text-xl font-semibold mb-4">Crear Tabla (MariaDB)</DialogTitle>

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
                                        <option>DECIMAL(10,2)</option>
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
                        <pre id="newTableQuery" className="p-3 bg-gray-100 rounded mt-2 whitespace-pre-wrap text-sm">
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
                            id="wcisya"
                            onClick={handleCreateTable}
                            className="px-4 py-2 bg-green-500 text-white rounded"
                        >
                            Crear Tabla
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
