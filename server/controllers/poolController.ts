import { Request, Response } from "express";
import { createPoolService } from "../services/poolServices";

export async function createPoolController(req: Request<{}, {}, { host: string, user: string, password: string, database: string, port: number }, {}>, res: Response) {
    const { host, user, password, database, port } = req.body;

    const pool = await createPoolService(host, user, password, database, port);

    if (pool.error) return res.status(500).json(pool);

    return res.status(200).json(pool);
}
