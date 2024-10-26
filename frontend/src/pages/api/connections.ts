import { PoolConnection, SqlError } from "mariadb";
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
function rowsToResponse(rows: object[]) {
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

        try {

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
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: (error as SqlError).cause.sqlMessage });
        }
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
        // Queries constantes

        retrieve_queries.set("tables",
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'DB_NAME'");
        retrieve_queries.set("pk",
            "SELECT table_name, index_name, column_name, index_type FROM information_schema.statistics WHERE table_schema = 'DB_NAME' AND index_name = 'PRIMARY'");
        retrieve_queries.set("fk",
            "SELECT table_name, column_name, constraint_name, referenced_table_name, referenced_column_name FROM information_schema.key_column_usage WHERE referenced_table_name IS NOT NULL AND table_schema = 'DB_NAME'");
        retrieve_queries.set("indices",
            "SELECT table_name, index_name, column_name, index_type FROM information_schema.statistics WHERE table_schema = 'DB_NAME' AND index_name != 'PRIMARY'");
        retrieve_queries.set("procedures",
            "SELECT routine_type, routine_name FROM information_schema.routines");
        retrieve_queries.set("triggers",
            "SELECT trigger_name, event_manipulation, event_object_table, action_statement FROM information_schema.triggers"
        )
        retrieve_queries.set("views",
            "SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'VIEW'"
        )
        retrieve_queries.set("checks",
            "SELECT constraint_name, table_name, check_clause FROM information_schema.check_constraints"
        )

        const { poolId, query, sqlQuery, dbName } = req.body;

        const conn = connections.get(parseInt(poolId));
        if (!conn) return res.status(404).json({ error: "Connection not found" });

        try {

            let sql;

            if (query === "own" || query === "info") sql = sqlQuery;
            else sql = retrieve_queries.get(query)

            if (!sql) return res.status(404).json({ error: "Query not found" });
            sql = sql.replace("DB_NAME", dbName);
            console.log(sql)
            let rows;

            // Se ejecuta query custom
            if (query === "own") {
                rows = await conn.execute(sql);
                await conn.commit();
            } else if (query === "info") {
                // Disenado para retraer info del schema
                rows = await conn.query(sql);
                console.log(rows);
                return res.status(200).json(rows);
            } else rows = await conn.query(sql);

            if (!rows.length) {
                console.log("No rows found. Returning empty response");
                return res.status(200).json({ headers: [], data: [] });
            }

            if (query === "own") return res.status(200).json(rows);
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