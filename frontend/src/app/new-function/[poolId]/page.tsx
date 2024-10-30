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

interface Parameter {
    name: string;
    type: string;
}

const dataTypes = ["INT", "VARCHAR(100)", "TEXT", "DATE", "BOOLEAN", "FLOAT"]; // Tipos de datos comunes

export default function CreateFunctionPage() {
    const params = useParams<{ poolId: string }>();
    const poolId = parseInt(params.poolId);
    const router = useRouter();

    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [name, setName] = useState<string>("");
    const [sqlQuery, setSqlQuery] = useState<string>("");
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [parameterName, setParameterName] = useState<string>("");
    const [parameterType, setParameterType] = useState<string>(dataTypes[0]);
    const [returnType, setReturnType] = useState<string>(dataTypes[0]);
    const [isFunction, setIsFunction] = useState<boolean>(true); // Determina si es una función o procedimiento
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConnectionInfo = async () => {
            try {
                const response = await fetch(`http://localhost:3001/pool/get/${poolId}`);
                if (!response.ok) throw new Error("Error al obtener la información de conexión.");
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

    const addParameter = () => {
        if (parameterName) {
            setParameters([...parameters, { name: parameterName, type: parameterType }]);
            setParameterName("");
        }
    };

    const removeParameter = (index: number) => {
        setParameters(parameters.filter((_, i) => i !== index));
    };

    const generateQuery = (): string => {
        if (!name || !sqlQuery) return "";

        const paramString = parameters.map(param => `${param.name} ${param.type}`).join(", ");
        const returnStatement = isFunction ? `RETURNS ${returnType}` : "";
        const routineType = isFunction ? "FUNCTION" : "PROCEDURE";

        return `CREATE ${routineType} ${name}(${paramString}) ${returnStatement} BEGIN \n${sqlQuery} \nEND;`;
    };

    const handleCreateRoutine = async () => {
        if (!name || !sqlQuery || (isFunction && !returnType)) {
            alert("Por favor, completa todos los campos necesarios.");
            return;
        }

        const res = await fetch(`http://localhost:3001/connection/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poolId,
                sqlQuery: generateQuery(),
            }),
        });

        if (res.ok) {
            alert(`${isFunction ? "Función" : "Procedimiento"} creado exitosamente.`);
            router.push("/");
        } else {
            alert(`Error al crear ${isFunction ? "función" : "procedimiento"}.`);
        }
    };

    if (loading) return <div>Cargando información de conexión...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Crear {isFunction ? "Función" : "Procedimiento"} (MariaDB)</h1>
            <p className="text-sm mb-4">
                Conectado a: <b>{connectionInfo?.database}</b> - {connectionInfo?.user}@{connectionInfo?.host}:{connectionInfo?.port}
            </p>

            <label className="block text-sm font-medium mb-2">Tipo</label>
            <select
                value={isFunction ? "FUNCTION" : "PROCEDURE"}
                onChange={(e) => setIsFunction(e.target.value === "FUNCTION")}
                className="mt-1 p-2 w-full border rounded"
            >
                <option value="FUNCTION">Función</option>
                <option value="PROCEDURE">Procedimiento</option>
            </select>

            <label className="block text-sm font-medium mt-4">Nombre</label>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 p-2 w-full border rounded"
                placeholder="Nombre de la función o procedimiento"
            />

            <div className="mt-4">
                <h3 className="text-lg font-medium">Parámetros</h3>
                <div className="flex space-x-2 mt-2">
                    <input
                        type="text"
                        value={parameterName}
                        onChange={(e) => setParameterName(e.target.value)}
                        className="p-2 border rounded w-1/2"
                        placeholder="Nombre del parámetro"
                    />
                    <select
                        value={parameterType}
                        onChange={(e) => setParameterType(e.target.value)}
                        className="p-2 border rounded w-1/2"
                    >
                        {dataTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={addParameter}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        Agregar
                    </button>
                </div>
                <ul className="mt-2">
                    {parameters.map((param, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                            {param.name} {param.type}
                            <button
                                onClick={() => removeParameter(index)}
                                className="ml-2 text-red-500"
                            >
                                Eliminar
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {isFunction && (
                <div className="mt-4">
                    <label className="block text-sm font-medium">Tipo de Retorno</label>
                    <select
                        value={returnType}
                        onChange={(e) => setReturnType(e.target.value)}
                        className="mt-1 p-2 w-full border rounded"
                    >
                        {dataTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <label className="block text-sm font-medium mt-4">Consulta SQL</label>
            <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Escribe aquí la consulta SQL..."
                className="mt-1 p-2 w-full border rounded h-32"
            />

            <div className="mt-6">
                <h3 className="text-lg font-medium">Consulta SQL Generada</h3>
                <pre className="p-3 bg-gray-100 rounded mt-2 whitespace-pre-wrap text-sm">
                    {generateQuery()}
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
                    onClick={handleCreateRoutine}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Crear {isFunction ? "Función" : "Procedimiento"}
                </button>
            </div>
        </div>
    );
}
