import dotenv from "dotenv";
import connectDb from "./src/db/index.js";
import { app } from "./app.js";

dotenv.config();

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed!", err);
  });
