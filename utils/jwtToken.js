import { generateToken } from "../utils/authHelpers.js";
// Create Token and saving in cookie

const sendToken = async (user, statusCode, res) => {
    //const token = user.getJWTToken();
    const token = await generateToken(user._id);
    console.log(token);
    console.log("sendToken generateToken(*,*) above");

    //res.status(statusCode).send({
    res.status(statusCode).cookie("token", token, { secure: false }).json({
        success: true,
        data: {
            user
        },
        token
    });
};

export { sendToken };
