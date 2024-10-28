import { Request, Response } from "express";
import { createPoolService, getPoolsService } from "../services/poolServices";

export async function createPoolController(req: Request<{}, {}, { host: string, user: string, password: string, database: string, port: number }, {}>, res: Response) {
    const { host, user, password, database, port } = req.body;

    const pool = await createPoolService(host, user, password, database, port);

    if (pool.error) return res.status(500).json(pool);

    return res.status(200).json(pool);
}

export async function getPoolsController(req: Request, res: Response) {
    const pools = await getPoolsService();
    return res.status(200).json(Array.from(pools));
}

export async function getPoolByIdController(req: Request<{ poolId: string }, {}, {}, {}>, res: Response) {
    const pools = await getPoolsService();
    const found = pools.find((pool) => pool.id === parseInt(req.params.poolId));

    if (!found) return res.status(404).json({ error: "Pool not found" });
    return res.status(200).json(found);
}