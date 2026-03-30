const express = require("express");
const app = express();
const userRouter = require("./routes/auth");
const db = require("./config/db");
const cors = require("cors");
const Postrouter = require("./routes/posts");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://medora-guh0bubo5-muneeb525353-2091s-projects.vercel.app",
      "https://medora-git-main-muneeb525353-2091s-projects.vercel.app",
      /\.vercel\.app$/, // allows ALL vercel.app subdomains
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(express.json());

app.use("/api/", userRouter);
app.use("/api/", Postrouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
