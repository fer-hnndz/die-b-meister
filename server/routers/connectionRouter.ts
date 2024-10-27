import { Router, Request, Response } from "express";

// Controllers
import { retrieveDBInfoController, executeQueryController, createConnectionController } from "../controllers/connectionController";
import { createPoolService } from "../services/poolServices";

const connectionRouter = Router();

connectionRouter.post("/create", createConnectionController)
connectionRouter.get("/retrieve", retrieveDBInfoController)
connectionRouter.post("/execute", executeQueryController)

export default connectionRouter;