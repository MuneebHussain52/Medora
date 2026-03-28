const express = require("express");
const app = express();
const userRouter = require("./routes/auth");
const db = require("./config/db");
const cors = require("cors");
const Postrouter = require("./routes/posts");
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

const port = 3000;

app.use(express.json());

app.use("/api/", userRouter);
app.use("/api/", Postrouter);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
