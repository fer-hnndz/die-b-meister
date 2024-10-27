import mariadb from 'mariadb';
import { checkIfFileExists, getPools, savePool } from '../utils';

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

export async function createPoolService(host: string, user: string, password: string, database: string, port: number) {
    try {

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

        console.log("[poolServices.createPool] Intentando obtener conexión...");
        await (await pool.getConnection()).end()

        // Guardar el pool en un objeto poolsInfo

        checkIfFileExists();
        const poolId = savePool(host, user, port, database);

        return { poolId };

    } catch (err) {
        console.log(err)
        // En caso de error, devolver el mensaje de error
        return { error: 'Error creando el pool', details: err };
    }
}