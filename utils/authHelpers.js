import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  return token;
};

const createHashedPassword = async (password) => {
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (error) {
    console.log(error);
    throw new Error("Failed to create hashed password.");
  }

  return hashedPassword;
};

const comparePassword = async (password, hashedPassword) => {
    let result;
    try {
        result = await bcrypt.compare(password, hashedPassword);
    }catch(error){
        throw new Error("Passwords do not match");
    }
    return result;
};

export {generateToken, createHashedPassword, comparePassword};
