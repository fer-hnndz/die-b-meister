import { Request, Response, Router } from "express";
import { createPoolController, getPoolsController, getPoolByIdController } from "../controllers/poolController";
import cors from "cors";

const poolRouter = Router();
poolRouter.use(cors());

poolRouter.post("/create", createPoolController);
poolRouter.get("/get", getPoolsController);
poolRouter.get("/get/:poolId", getPoolByIdController);
export default poolRouter;


