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

interface Parameter {
    name: string;
    type: string;
}

export default function EditFunctionPage() {
    const params = useParams<{ poolId: string }>();
    const poolId = parseInt(params.poolId);
    const router = useRouter();

    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [functionName, setFunctionName] = useState<string>("");
    const [functionBody, setFunctionBody] = useState<string>("");
    const [parameters, setParameters] = useState<Parameter[]>([]);
    const [returnType, setReturnType] = useState<string>("");
    const [functionsList, setFunctionsList] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchConnectionInfo = async () => {
            try {
                const response = await fetch(`http://localhost:3001/pool/get/${poolId}`);
                if (!response.ok) throw new Error("Error al obtener la información de conexión.");
                const data = await response.json();
                setConnectionInfo(data);

                const functionsRes = await fetch(`http://localhost:3001/connection/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        poolId: poolId,
                        sqlQuery: `SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_TYPE = 'FUNCTION' AND ROUTINE_SCHEMA = '${data.database}';`,
                    }),
                });

                if (!functionsRes.ok) throw new Error("Error al obtener la lista de funciones.");
                const functionsData = await functionsRes.json();
                const functionNames = functionsData.map((row: any) => row.ROUTINE_NAME);
                setFunctionsList(functionNames);
                console.log("Lista de funciones obtenida", functionNames)
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchConnectionInfo();
        setLoading(false)
    }, []);

    useEffect(() => {
        const fetchFunctionDetails = async (name: string) => {
            try {

                if (!name) {
                    setFunctionBody("");
                    setParameters([]);
                    setReturnType("");
                    return;
                }

                const sql = `SELECT ROUTINE_DEFINITION FROM information_schema.ROUTINES WHERE ROUTINE_NAME = '${functionName}' AND ROUTINE_TYPE = 'FUNCTION' AND ROUTINE_SCHEMA = '${connectionInfo?.database}';`
                console.log(sql)
                // Obtener cuerpo de la función
                const functionRes = await fetch(`http://localhost:3001/connection/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        poolId: poolId,
                        sqlQuery: sql,
                    }),
                });

                if (!functionRes.ok) throw new Error("Error al obtener el cuerpo de la función.");
                const functionData = await functionRes.json();
                console.log("Function Data", functionData);
                const functionDefinition = functionData[0].ROUTINE_DEFINITION; // Cambiado a índice 2 para obtener el cuerpo
                setFunctionBody(functionDefinition);

                // Obtener parámetros
                const paramsRes = await fetch(`http://localhost:3001/connection/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        poolId: poolId,
                        sqlQuery: `SELECT PARAMETER_NAME, DATA_TYPE 
                                    FROM information_schema.PARAMETERS 
                                    WHERE SPECIFIC_NAME = '${name}' 
                                    AND ROUTINE_TYPE = 'FUNCTION';`,
                    }),
                });

                if (!paramsRes.ok) throw new Error("Error al obtener los parámetros de la función.");
                const paramsData = await paramsRes.json();
                console.log("Params Data", paramsData);
                const parsedParams = paramsData.filter((parameter) => parameter.PARAMETER_NAME != null).map((row: any) => ({
                    name: row.PARAMETER_NAME,
                    type: row.DATA_TYPE,
                }));

                setParameters(parsedParams);
                setReturnType(paramsData[0].DATA_TYPE);

                // Obtener tipo de retorno
                const returnTypeRes = await fetch(`http://localhost:3001/connection/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        poolId: poolId,
                        sqlQuery: `SELECT DATA_TYPE 
                                    FROM information_schema.ROUTINES 
                                    WHERE ROUTINE_NAME = '${name}' 
                                    AND ROUTINE_TYPE = 'FUNCTION';`,
                    }),
                });

                if (!returnTypeRes.ok) throw new Error("Error al obtener el tipo de retorno.");
                const returnTypeData = await returnTypeRes.json();
                setReturnType(returnTypeData[0].DATA_TYPE);
            } catch (err: any) {
                setError(err.message);
            }
        };

        fetchFunctionDetails(functionName)
    }, [functionName])


    const handleUpdateFunction = async () => {
        if (!functionBody) {
            alert("Por favor, completa el cuerpo de la función.");
            return;
        }

        const res = await fetch(`http://localhost:3001/connection/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poolId,
                sqlQuery: `DROP FUNCTION IF EXISTS ${functionName}; ${functionBody}`,
            }),
        });

        if (res.ok) {
            alert("Función actualizada exitosamente.");
            router.push("/");
        } else {
            alert("Error al actualizar la función.");
        }
    };

    if (loading) return <div>Cargando información de conexión...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Editar Función (MariaDB)</h1>
            <p className="text-sm mb-4">
                Conectado a: <b>{connectionInfo?.database}</b> - {connectionInfo?.user}@{connectionInfo?.host}:{connectionInfo?.port}
            </p>

            <label className="block text-sm font-medium mb-2">Selecciona una Función</label>
            <select
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                className="mt-1 p-2 w-full border rounded"
            >
                <option value="">Selecciona una función</option>
                {functionsList.map((func) => (
                    <option key={func} value={func}>
                        {func}
                    </option>
                ))}
            </select>

            <label className="block text-sm font-medium mt-4">Cuerpo de la Función</label>
            <textarea
                value={functionBody}
                onChange={(e) => setFunctionBody(e.target.value)}
                placeholder="Escribe aquí el cuerpo de la función..."
                className="mt-1 p-2 w-full border rounded h-32"
            />

            <h3 className="text-lg font-medium mt-4">Parámetros</h3>
            <ul className="list-disc ml-6">
                {parameters.map((param) => (
                    <li key={param.name}>
                        {param.name} ({param.type})
                    </li>
                ))}
            </ul>

            <div className="mt-4 flex justify-end">
                <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 bg-red-500 text-white rounded mr-2"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleUpdateFunction}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Actualizar Función
                </button>
            </div>
        </div>
    );
}
