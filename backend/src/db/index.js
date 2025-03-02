import mongoose from "mongoose";

const DB_NAME = "TwitterDB";

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MongoDB connection Failed!", error);
    process.exit(1);
  }
};

export default connectDb;
