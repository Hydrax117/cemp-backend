import { generateToken } from "../utils/authHelpers.js";
// Create Token and saving in cookie

const sendToken = async (user, statusCode, res) => {
  //const token = user.getJWTToken();
  const token = await generateToken(user._id);
  console.log(user);
  res.status(statusCode).cookie("token", token, { secure: false }).json({
    success: true,
    message: "Signup successfull",
    data: {
      user,
    },
    token,
  });
};

export { sendToken };
