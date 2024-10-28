import { PoolData } from "./interfaces";
import * as fs from "fs";

const defaultPoolJSON = {
    nextId: 1,
    pools: []
}

/** 
* Checks if the JSON file for storing pool parameters exists.
* It creates the file if it doesn't exist.
*/
export function checkIfFileExists() {
    try {
        fs.readFileSync("pools.json", "utf-8");
    } catch {
        fs.writeFileSync("pools.json", JSON.stringify(defaultPoolJSON));
    }
}

/**
 * Saves a pool to the pools.json file.
 * @param host The hostname of the database
 * @param user The username of the database
 * @param port The port of the database
 * @param database The name of the database
 * @returns The ID of the newly saved pool.
 */
export function savePool(host: string, user: string, port: number, database: string) {
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

    fs.writeFileSync("pools.json", JSON.stringify(poolsData, null, 4));
    return poolId;
}

/**
 * 
 * @returns Returns the pools stored in the pools.json file.
 */
export function getPools(): PoolData[] {
    checkIfFileExists();
    const poolsJson = fs.readFileSync("pools.json", "utf-8");
    const data = JSON.parse(poolsJson).pools;

    // parse to array
    return data;
}

/**
 * 
 * @param poolId The ID of the pool to retrieve.
 * @returns The pool with the given ID.
 */
export function getPoolById(poolId: number): PoolData | undefined {
    const pools: PoolData[] = getPools();
    return pools.find(pool => pool.id === poolId);
}