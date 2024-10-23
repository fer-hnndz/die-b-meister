"use server"

import { createPool } from "mariadb";

export async function createNewPool(host: string, port: number, user: string, pass: string, db: string) {
    const pool = createPool({
        host: host,
        port: port,
        user: user,
        password: pass,
        database: db
    });

    return pool;

}