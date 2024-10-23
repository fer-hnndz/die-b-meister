import type { NextApiRequest, NextApiResponse } from 'next';
import mariadb from 'mariadb';
import { pools } from './pool';

// Definir la interfaz para el cuerpo de la solicitud
interface QueryRequestBody {
    poolId: number; // Cambiar a número
    query: string;
}

// API para ejecutar una consulta en un pool específico
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { poolId, query } = req.body as QueryRequestBody;

        // Verificar si el pool con el ID proporcionado existe
        const pool = pools[poolId];
        if (!pool) {
            return res.status(404).json({ error: 'Pool no encontrado' });
        }

        let conn: mariadb.Connection | null = null;
        try {
            // Obtener una conexión del pool
            conn = await pool.getConnection();

            // Ejecutar la consulta proporcionada
            const result = await conn.query(query);

            // Devolver el resultado de la consulta
            res.status(200).json(result);
        } catch (err) {
            res.status(500).json({ error: 'Error ejecutando la consulta', details: (err as Error).message });
        } finally {
            // Liberar la conexión
            if (conn) conn.end();
        }
    } else {
        res.status(405).json({ error: 'Método no permitido' });
    }
}
