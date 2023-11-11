require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();
const connectDB = require("./db/connect");
const adminRouter = require("./routes/admin");

app.use(express.json());

app.use("/ecommerce/admin", adminRouter);

// error handler
const notFoundMiddleware = require("./middleware/not-found");

app.use(notFoundMiddleware);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
