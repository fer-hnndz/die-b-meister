import express from 'express';
import connectionRouter from './routers/connectionRouter';
import poolRouter from './routers/poolRouter';
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/connection", connectionRouter);
app.use("/pool", poolRouter)

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(3001, () => {
    console.log("Server is running on port 3001");
});