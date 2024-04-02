//import mongoose from "mongoose";
import mongoose from "mongoose";

const connectToDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
        autoIndex:true});

        console.log(`Connected to db at ${ conn.connection.host }`);
    }catch(error){
        console.log(error);
        process.exit(1);
    }
};

export { connectToDB };