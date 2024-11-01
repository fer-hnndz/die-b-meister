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

export default function EditViewPage() {
    const params = useParams<{ poolId: string }>();
    const poolId = parseInt(params.poolId);
    const router = useRouter();

    const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
    const [viewName, setViewName] = useState<string>("");
    const [viewQuery, setViewQuery] = useState<string>("");
    const [views, setViews] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Obtener información de conexión
        const fetchConnectionInfo = async () => {
            try {
                const response = await fetch(`http://localhost:3001/pool/get/${poolId}`);
                if (!response.ok) throw new Error("Error al obtener la información de conexión.");
                const data = await response.json();
                setConnectionInfo(data);

                // Obtener lista de vistas
                const viewsRes = await fetch(`http://localhost:3001/connection/execute`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        poolId,
                        sqlQuery: `SHOW FULL TABLES IN ${data.database} WHERE Table_type = 'VIEW';`,
                    }),
                });

                if (!viewsRes.ok) throw new Error("Error al obtener la lista de vistas.");
                const viewsData = await viewsRes.json();
                const viewsList = viewsData.map((row: any) => row[`Tables_in_${data.database}`]);
                setViews(viewsList);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConnectionInfo();
    }, [poolId]);

    const fetchViewQuery = async (view: string) => {
        try {
            const viewQueryRes = await fetch(`http://localhost:3001/connection/execute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    poolId,
                    sqlQuery: `SHOW CREATE VIEW ${view};`,
                }),
            });

            if (!viewQueryRes.ok) throw new Error("Error al obtener la consulta de la vista.");
            const viewData = await viewQueryRes.json();

            const fullQuery = viewData[0]['Create View']; // Suponiendo que el resultado tenga esta estructura
            const queryParts = fullQuery.split(" AS "); // Dividir la cadena en " AS "
            if (queryParts.length > 1) {
                setViewName(view);
                // Unir el segundo segmento y el resto usando join
                setViewQuery(queryParts.slice(1).join(" AS ").trim()); // Establecer la consulta SQL unida
            } else {
                setViewName(view);
                setViewQuery(fullQuery); // En caso de que no haya "AS", establecer la cadena completa
            }
        } catch (err: any) {
            setError(err.message);
        }
    };


    const handleViewChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedView = event.target.value;
        fetchViewQuery(selectedView);
    };

    const generateViewQuery = (): string => {
        if (!viewName || !viewQuery) return "";
        return `CREATE OR REPLACE VIEW ${viewName} AS ${viewQuery};`;
    };

    const handleEditView = async () => {
        if (!viewName || !viewQuery) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const res = await fetch(`http://localhost:3001/connection/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                poolId,
                sqlQuery: generateViewQuery(),
            }),
        });

        if (res.ok) {
            alert("Vista editada exitosamente.");
            router.push("/");
        } else {
            alert("Error al editar la vista.");
        }
    };

    if (loading) return <div>Cargando información de conexión...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Editar Vista (MariaDB)</h1>
            <p className="text-sm mb-4">
                Conectado a: <b>{connectionInfo?.database}</b> - {connectionInfo?.user}@{connectionInfo?.host}:{connectionInfo?.port}
            </p>

            <label className="block text-sm font-medium mt-4">Seleccionar Vista</label>
            <select
                value={viewName}
                onChange={handleViewChange}
                className="mt-1 p-2 w-full border rounded"
            >
                <option value="" disabled>Selecciona una vista</option>
                {views.map((view) => (
                    <option key={view} value={view}>
                        {view}
                    </option>
                ))}
            </select>

            <label className="block text-sm font-medium mt-4">Consulta SQL para la Vista</label>
            <textarea
                value={viewQuery}
                onChange={(e) => setViewQuery(e.target.value)}
                placeholder="Escribe aquí la consulta SQL para crear la vista..."
                className="mt-1 p-2 w-full border rounded h-32"
            />

            <div className="mt-6">
                <h3 className="text-lg font-medium">Consulta SQL Generada</h3>
                <pre className="p-3 bg-gray-100 rounded mt-2 whitespace-pre-wrap text-sm">
                    {generateViewQuery()}
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
                    onClick={handleEditView}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                >
                    Editar Vista
                </button>
            </div>
        </div>
    );
}
