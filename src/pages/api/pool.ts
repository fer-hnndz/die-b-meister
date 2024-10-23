// pages/api/pool.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import mariadb from 'mariadb';

// Definir la interfaz para el cuerpo de la solicitud
interface PoolRequestBody {
    host: string;
    user: string;
    password: string;
    database: string;
    connectionLimit?: number;
}

// Objeto para almacenar los pools de conexión
export const pools: Record<number, mariadb.Pool> = {};
let nextPoolId = 1; // Contador para el siguiente ID de pool

// Crear un pool y devolver su ID
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Validar que el body tiene el formato correcto
        const { host, user, password, database, connectionLimit } = req.body as PoolRequestBody;

        try {
            // Crear un nuevo pool de conexión
            const pool = mariadb.createPool({
                host,
                user,
                password,
                database,
                connectionLimit: connectionLimit || 5, // Valor por defecto de límite
            });

            // Asignar el ID actual y luego incrementarlo
            const poolId = nextPoolId++;

            // Guardar el pool en el objeto 'pools' con su ID
            pools[poolId] = pool;

            // Devolver el ID del pool creado
            res.status(200).json({ poolId });
        } catch (err) {
            // En caso de error, devolver el mensaje de error
            res.status(500).json({ error: 'Error creando el pool', details: err });
        }
    } else {
        // Si el método no es POST, devolver un error
        res.status(405).json({ error: 'Método no permitido' });
    }
}
