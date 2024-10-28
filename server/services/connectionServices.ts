import { getPoolById } from "../utils";
import mariadb from "mariadb";

interface RetrieveParams {
    query: "tables" | "pk" | "fk" | "indices" | "procedures" | "triggers" | "views" | "checks";
}

interface RetrieveQuery {
    columns: string[];
    table: string;
    where?: string
}

const queries = new Map<string, RetrieveQuery>();

queries.set("tables", {
    columns: ["table_name"],
    table: "information_schema.tables",
    where: "table_schema = 'DB_NAME'"
})

queries.set("pk", {
    columns: ["table_name", "index_name", "column_name", "index_type"],
    table: "information_schema.statistics",
    where: "table_schema = 'DB_NAME' AND index_name = 'PRIMARY'"
})

queries.set("fk", {
    columns: ["table_name", "column_name", "constraint_name", "referenced_table_name", "referenced_column_name"],
    table: "information_schema.key_column_usage",
    where: "referenced_table_name IS NOT NULL AND table_schema = 'DB_NAME'"
})

queries.set("indices", {
    columns: ["table_name", "index_name", "column_name", "index_type"],
    table: "information_schema.statistics",
    where: "table_schema = 'DB_NAME' AND index_name != 'PRIMARY'"
})

queries.set("procedures", {
    columns: ["routine_type", "routine_name"],
    table: "information_schema.routines"
})

queries.set("triggers", {
    columns: ["trigger_name", "event_manipulation", "event_object_table", "action_statement"],
    table: "information_schema.triggers"
})

queries.set("views", {
    columns: ["table_schema", "table_name"],
    table: "information_schema.tables",
    where: "table_type = 'VIEW'"
})

queries.set("checks", {
    columns: ["constraint_name", "table_name", "check_clause"],
    table: "information_schema.check_constraints"
})

export async function createConnectionService(poolId: number, password: string) {
    const poolData = getPoolById(poolId);

    if (!poolData) return null;

    try {
        const pool = mariadb.createPool({
            host: poolData.host,
            port: poolData.port,
            user: poolData.user,
            password: password,
            database: poolData.database,
            bigIntAsNumber: true,
            decimalAsNumber: true
        });

        return await pool.getConnection();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function retrieveDBInfoService(poolId: number, query: string, conn: mariadb.PoolConnection) {
    const poolData = getPoolById(poolId)

    if (!poolData) throw new Error("Pool not found");
    const databaseName = poolData.database;

    try {
        // Build query from query map.

        const queryInfo = queries.get(query);
        let sqlQuery = "";

        if (!queryInfo) throw new Error("Query not found");

        sqlQuery = `SELECT ${queryInfo.columns.join(", ")} FROM ${queryInfo.table.replace("DB_NAME", databaseName)} ${queryInfo.where ? `WHERE ${queryInfo.where.replace("DB_NAME", databaseName)}` : ""}`;

        const rows = await conn.query(sqlQuery);
        if (rows.length === 0) return {
            headers: queryInfo.columns.map(column => (column.replace("_", " ").toUpperCase())),
            data: []
        };

        return {
            headers: Object.keys(rows[0]).map(column => column.replace("_", " ").toUpperCase()),
            data: rows.map((row: Object) => Object.values(row))
        }

    } catch (error) {
        console.error(error);
        return { error: (error as mariadb.SqlError).sqlMessage, headers: [], data: [] };
    }
}

export async function executeQueryService(query: string, connection: mariadb.PoolConnection) {
    const rows = connection.execute(query);
    return rows;
}