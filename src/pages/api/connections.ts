import { PoolConnection } from "mariadb";
import { getPoolById } from "./poolJson";
import mariadb from "mariadb";
import { NextApiRequest, NextApiResponse } from "next";

const retrieve_queries = new Map<string, string>();

export const connections = new Map<number, PoolConnection>();

/**
 * Transforms a row into a response object like so:
 * {
 *  headers: []
 *  data: [[], [], []]
 * }
 */
function rowsToResponse(rows: any[]) {
    // Get object keys
    const keys = Object.keys(rows[0])

    for (let i = 0; i < keys.length; i++) {
        keys[i] = keys[i].toUpperCase();
        keys[i] = keys[i].replace("_", " ");
    }

    const headers = keys;
    const data = rows.map((row) => {
        return Object.values(row);
    });

    console.log({ headers, data })
    return { headers, data }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "POST") {
        const { poolId, password } = req.body;

        console.log("[connections:POST] Creating connection for pool", poolId);
        const poolData = getPoolById(parseInt(poolId));

        if (!poolData) return res.status(404).json(JSON.stringify({ error: "Pool not found" }));

        const pool = mariadb.createPool({
            host: poolData.host,
            port: poolData.port,
            user: poolData.user,
            password: password,
            database: poolData.database
        });

        const conn = await pool.getConnection();
        connections.set(parseInt(poolId), conn);
        return res.status(200).json({ message: "Connection created successfully" });
    } else if (req.method === "DELETE") {
        const { poolId } = req.body;
        const pool = connections.get(parseInt(poolId));
        if (pool) {
            pool.release();
            connections.delete(parseInt(poolId));
            return res.status(200).json({ message: "Connection deleted successfully" });
        } else {
            return res.status(404).json({ error: "Connection not found" });
        }
    } else if (req.method === "PUT") {
        retrieve_queries.set("tables", "SELECT table_name, index_name, column_name index_type FROM information_schema.statistics");

        const { poolId, query } = req.body;

        const conn = connections.get(parseInt(poolId));
        if (!conn) return res.status(404).json({ error: "Connection not found" });

        try {
            const rows = await conn.query(retrieve_queries.get(query)!);
            const response = rowsToResponse(rows);
            return res.status(200).json(response);
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: err });
        }
    } else if (req.method === "GET") {
        const { poolId } = req.query;

        // Weird typing
        const poolIdNum = Array.isArray(poolId) ? parseInt(poolId[0]) : parseInt(poolId || "-1");

        const conn = connections.get(poolIdNum);
        if (!conn) return res.status(404).json({ error: "Connection not found" });
        return res.status(200).json({ message: "Connection found" });
    } else {
        return res.status(405).json({ error: "Method not allowed" });
    }
}