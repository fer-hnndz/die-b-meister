import { Request, Response } from "express";
import { createConnectionService, retrieveDBInfoService } from "../services/connectionServices";
import mariadb from "mariadb";

const connections = new Map<number, mariadb.PoolConnection>();

// Controller para crear una conexión
export async function createConnectionController(req: Request, res: Response) {
    try {
        const { poolId, password } = req.body as { poolId: number; password: string };
        const connection = await createConnectionService(poolId, password);

        if (!connection) return res.status(404).json({ error: "Pool not found" });

        connections.set(poolId, connection);
        return res.status(200).json({ poolId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error creating connection", trace: err });
    }
};

export async function isConnectedController(req: Request, res: Response) {
    try {
        const { poolId } = req.query as unknown as { poolId: number };
        const connection = connections.get(poolId);

        if (!connection) return res.status(404).json({ isConnected: false });

        return res.status(200).json({ isConnected: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error checking connection", trace: err });
    }
}

// Controller para recuperar información de la base de datos
export async function retrieveDBInfoController(req: Request, res: Response) {
    try {

        // Typescript en sus sabiduria infinita...
        const { poolId, query } = req.query as unknown as { poolId: number; query: string };
        const connection = connections.get(poolId);

        if (!connection) return res.status(404).json({ error: "Connection not found" });

        const info = await retrieveDBInfoService(poolId, query, connection);
        return res.status(200).json(info);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error retrieving DB info", trace: err });
    }
};

// Controller para ejecutar una consulta
export async function executeQueryController(req: Request, res: Response) {
    try {
        const { query, poolId } = req.body as { query: string; poolId: number };
        const connection = connections.get(poolId);

        if (!connection) return res.status(404).json({ error: "Connection not found" });

        const rows = await connection.query(query);
        return res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Error executing query", trace: err });
    }
};
