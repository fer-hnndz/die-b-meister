import { Router, Request, Response } from "express";

// Controllers
import { retrieveDBInfoController, executeQueryController, createConnectionController, isConnectedController } from "../controllers/connectionController";
import cors from "cors";

const connectionRouter = Router();
connectionRouter.use(cors())

connectionRouter.post("/create", createConnectionController)
connectionRouter.post("/retrieve", retrieveDBInfoController)
connectionRouter.post("/execute", executeQueryController)
connectionRouter.get("/isConnected", isConnectedController)

export default connectionRouter;