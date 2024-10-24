// pages/api/pool.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import mariadb from 'mariadb';
import * as fs from 'fs';
import { PoolData, PoolRequestBody } from '@/interfaces';


/*
Formato de pools.json:
{
    nextId: 1;
    pools: [
        {
            id: 1,
            host: "localhost",
            port: 3306,
            user: "root",
            db: "test",            
        }
    ]
}
*/

const defaultPoolJSON = {
    nextId: 1,
    pools: []
}


function checkIfFileExists() {
    try {
        fs.accessSync("pools.json", fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        // Validar que el body tiene el formato correcto
        const { host, user, password, database, port } = req.body as PoolRequestBody;

        try {
            console.log("Saving pool....")

            // Crear nuevo pool
            const pool = mariadb.createPool({
                host,
                user,
                password,
                database,
                port,
                connectionLimit: 5,
                acquireTimeout: 3000
            });

            console.log("Intendando obtener conexión...");
            await pool.getConnection()
            await pool.end();

            // En este punto, nos conectamos exitosamente a la base de datos.
            // Guardar el pool en un objeto poolsInfo

            if (checkIfFileExists()) {
                console.log("File exists");
            } else {
                fs.writeFileSync("pools.json", JSON.stringify(defaultPoolJSON));
            }

            const poolsJson = fs.readFileSync("pools.json", "utf-8");
            const poolsData = JSON.parse(poolsJson);
            const poolId = poolsData.nextId;
            poolsData.pools.push(
                {
                    id: poolId,
                    host,
                    user,
                    port,
                    database
                }
            );
            poolsData.nextId++;

            // Write the file
            fs.writeFileSync("pools.json", JSON.stringify(poolsData));
            res.status(200).json({ poolId });

        } catch (err) {
            console.log(err)
            // En caso de error, devolver el mensaje de error
            res.status(500).json({ error: 'Error creando el pool', details: err });
        }
    } else if (req.method == "GET") {
        // Leer pools guardados

        if (checkIfFileExists()) {
            console.log("File exists");
        } else {
            fs.writeFileSync("pools.json", JSON.stringify(defaultPoolJSON));
        }

        const poolsJson = fs.readFileSync("pools.json", "utf-8");
        const poolsData = JSON.parse(poolsJson);
        return res.status(200).json(JSON.stringify(poolsData.pools));


    } else {
        // Si el método no es POST, devolver un error
        res.status(405).json({ error: 'Método no permitido' });
    }
}