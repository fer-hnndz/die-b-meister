import { Request, Response, Router } from "express";
import { createPoolController } from "../controllers/poolController";

const poolRouter = Router();

poolRouter.post("/pool/create", createPoolController);

export default poolRouter;


