"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { isNotFoundError } from "next/dist/client/components/not-found";

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
    const [functionsList, setFunctionsList] = useState<{ name: string, isFunc: boolean }[]>([]);
    const [isFunction, setIsFunction] = useState<boolean>(true); // Determina si es una función o procedimiento
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editQuery, setEditQuery] = useState<string>("");


    const dataTypes = ["INT", "VARCHAR(100)", "DATE", "FLOAT", "BOOLEAN"]; // Tipos de datos comunes

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
                        sqlQuery: `SELECT ROUTINE_TYPE, ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '${data.database}';`,
                    }),
                });

                if (!functionsRes.ok) throw new Error("Error al obtener la lista de funciones.");
                const functionsData = await functionsRes.json();
                console.warn(functionsData)
                const functionNames = functionsData.map((row: any) => ({ name: row.ROUTINE_NAME, isFunc: row.ROUTINE_TYPE === "FUNCTION" }));
                setFunctionsList(functionNames);

                console.log(functionNames)
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

                const func = functionsList.find((func) => func.name === name)
                if (!func) throw new Error("No se encontró la función.");
                setIsFunction(func.isFunc);

                const sql = `SELECT ROUTINE_DEFINITION FROM information_schema.ROUTINES WHERE ROUTINE_NAME = '${functionName}' AND ROUTINE_SCHEMA = '${connectionInfo?.database}';`;
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
                setFunctionBody(functionData[0].ROUTINE_DEFINITION);

                const paramsRes = await fetch(`http://localhost:3001/connection/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        poolId: poolId,
                        sqlQuery: `SELECT PARAMETER_NAME, DATA_TYPE 
                                    FROM information_schema.PARAMETERS 
                                    WHERE SPECIFIC_NAME = '${name}'`,
                    }),
                });

                if (!paramsRes.ok) throw new Error("Error al obtener los parámetros de la función.");
                const paramsData = await paramsRes.json();
                const parsedParams = paramsData.filter((parameter) => parameter.PARAMETER_NAME != null).map((row: any) => ({
                    name: row.PARAMETER_NAME,
                    type: row.DATA_TYPE,
                }));

                const returnType = paramsData.find((param: any) => param.PARAMETER_NAME === null)
                setReturnType((returnType) ? returnType.DATA_TYPE : "");
                setParameters(parsedParams);

                const returnTypeRes = await fetch(`http://localhost:3001/connection/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        poolId: poolId,
                        sqlQuery: `SELECT DATA_TYPE 
                                    FROM information_schema.ROUTINES 
                                    WHERE ROUTINE_NAME = '${name}'`,
                    }),
                });

                if (!returnTypeRes.ok) throw new Error("Error al obtener el tipo de retorno.");
                const returnTypeData = await returnTypeRes.json();
                setReturnType(returnTypeData[0].DATA_TYPE);
            } catch (err: any) {
                console.error(err)
                setError(err.message);
            }
        };

        fetchFunctionDetails(functionName)
    }, [functionName]);

    const handleAddParameter = () => {
        setParameters([...parameters, { name: "", type: dataTypes[0] }]);
    };

    const handleRemoveParameter = (index: number) => {
        setParameters(parameters.filter((_, i) => i !== index));
    };

    const handleParameterChange = (index: number, field: keyof Parameter, value: string) => {
        const updatedParameters = [...parameters];
        updatedParameters[index][field] = value;
        setParameters(updatedParameters);
    };

    useEffect(() => {
        const generateQuery = (): string => {
            const paramString = parameters.map(param => `${param.name} ${param.type}`).join(", ");
            const returnStatement = isFunction ? `RETURNS ${returnType}` : "";
            const routineType = isFunction ? "FUNCTION" : "PROCEDURE";

            return `CREATE ${routineType} ${functionName}(${paramString}) ${returnStatement} \n${functionBody}`;
        };

        setEditQuery(generateQuery());
    }, [functionBody, parameters, returnType])

    const handleUpdateFunction = async () => {
        console.log(functionBody)
        if (!functionBody) {
            alert("Por favor, completa el cuerpo de la función.");
            return;
        }


        const process = (isFunction ? "FUNCTION" : "PROCEDURE");
        const query = `DROP ${process} ${functionName};`

        const res = await fetch(`http://localhost:3001/connection/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poolId,
                sqlQuery: query,
            }),
        });

        if (!res.ok) {
            alert("Error al eliminar la función.");
            return
        }

        console.log(editQuery)
        const res2 = await fetch(`http://localhost:3001/connection/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poolId,
                sqlQuery: editQuery,
            }),
        });

        if (!res2.ok) {
            alert("Error al actualizar la función.");
            return
        }

        alert("Función actualizada correctamente.");
        router.push("/");

    };

    async function handleFunctionChange(funcName: string) {
        setFunctionName(funcName);
        const foundFunc = functionsList.find((func) => func.name === funcName)

        //handleUpdateFunction();
        if (!foundFunc) throw new Error("guaya")

        setIsFunction(foundFunc.isFunc);
    }

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
                    <option key={func.name} value={func.name}>
                        {func.name}
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

            <label className="block text-sm font-medium mt-4">Tipo de Retorno</label>
            <select
                value={returnType}
                onChange={(e) => setReturnType(e.target.value)}
                className="mt-1 p-2 w-full border rounded disabled:bg-pale disabled:cursor-not-allowed"
                disabled={!isFunction}
            >
                {dataTypes.map((type) => (
                    <option key={type} value={type}>
                        {type}
                    </option>
                ))}
            </select>

            <h3 className="text-lg font-medium mt-4">Parámetros</h3>
            <ul className="list-disc ml-6">
                {parameters.map((param, index) => (
                    <li key={index} className="mb-2">
                        <input
                            type="text"
                            placeholder="Nombre del parámetro"
                            value={param.name}
                            onChange={(e) => handleParameterChange(index, "name", e.target.value)}
                            className="mr-2 p-1 border rounded"
                        />
                        <select
                            value={param.type}
                            onChange={(e) => handleParameterChange(index, "type", e.target.value)}
                            className="mr-2 p-1 border rounded"
                        >
                            {dataTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                        <button onClick={() => handleRemoveParameter(index)} className="text-red-500">Eliminar</button>
                    </li>
                ))}
            </ul>
            <button
                onClick={handleAddParameter}
                className={`mt-2 p-1 text-blue-500 ${!functionName ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!functionName}
            >
                Añadir Parámetro
            </button>

            <div className="mt-4">
                <h3 className="text-lg font-medium">Consulta SQL para actualizar la función:</h3>
                <pre className="bg-gray-100 p-2 border rounded">{editQuery}</pre>
            </div>

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
                    Actualizar {isFunction ? "Función" : "Procedimiento"}
                </button>
            </div>
        </div>
    );
}
