import { generateToken } from "../utils/authHelpers.js";
// Create Token and saving in cookie

const sendToken = async (user, statusCode, res) => {
    //const token = user.getJWTToken();
    const token = await generateToken(user._id, user.email);
    console.log(token);
    console.log("sendToken generateToken(*,*) above");

    res.status(statusCode).cookie("token", token).json({
        success: true,
        data: {
          user
        },
        token
    });
};

export { sendToken };
