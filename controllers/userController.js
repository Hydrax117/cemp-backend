import User from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendEmail } from "../utils/email.js";
import HttpError from "../utils/http-error.js";
import {generateToken, createHashedPassword, comparePassword} from "../utils/authHelpers.js";

const signUp = catchAsync(async (req, res, next) => {
    try {

        const {fullname, email, password }  = req.body;
    
        if (!fullname || fullname.trim().length === 0){
            return next(HttpError("Fullname cannot be empty!", 400));
        }

        if (!email || email.trim().length === 0){
            return next(HttpError("Email cannot be empty!", 400));
        }

        if (!password || password.trim().length === 0){
            return next(HttpError("Password cannot be empty", 400));
        }

        const existingUser = await User.findOne({email});

        if (existingUser){
            return next(new HttpError("User already exists!", 400));
        }

        const passwordHash = await createHashedPassword(password);

        const newUser = new User({
            fullname,
            email,
            password: passwordHash,
        });

        await newUser.save();

        try {
            await sendEmail({
                email: newUser.email,
                subject: "Sign-up Notification",
                message: `Dear ${newUser.fullname}, Welcome to React community. Thank you for joining us`,
        })
        }catch (error){
            console.error("Error sending email:", error);
            return next(new HttpError("Message not sent Successfully", 500));
       }

        const token = await generateToken(newUser._id, newUser.email);

        res.status(200).json({
            success: true,
            message: "User Created Successfully",
            user: {
            userId: newUser._id,
            fullname: newUser.fullname,
            email: newUser.email,
            token
            }
        })
    }catch(error){
        console.error("Error creating user:", error);
        return next(new HttpError("Unable to create user, try again.", 500));
    }
});


const login = catchAsync(async (req, res, next) => {
    try {
        const {email, password} = req.body;
    
        if (!email || email.trim().length === 0){
            return next(new HttpError("Email cannot be empty", 400));
        }

        if (!password || password.trim().length === 0){
            return next(new HttpError("Password cannot be empty", 400));
        }
        
        const existingUser = await User.findOne({email});

        if (!existingUser){
            return next(new HttpError("User does not exist", 404));
        }

        // TODO - Compare password to existingUser password
        if (!(await comparePassword(password, existingUser.password))){
            return next(new HttpError("Passwords do not match", 400));
        }

        try {
            await sendEmail({
                email: existingUser.email,
                subject: "Login Notification",
                message: `Dear ${existingUser.fullname}, Your Login was Successful`,
        })
        }catch (error){
            return next(new HttpError("Message not sent Successfully", 500));
       }


        const token = await generateToken(existingUser._id, existingUser.email);

        res.status(201).json({
            success: true,
            message: "User Login Successful",
            user: {
                userId: existingUser._id,
                fullname: existingUser.fullname,
                email: existingUser.email,
                token,
            },
        });
        } catch (error) {
            return next(new HttpError("Unable to login, try again", 500));
        }

});


const getAllUsers = catchAsync(async (req, res, next) => {
    try {
        const allUsers = await User.find();
        res.status(200).json({
            success: true,
            length: users.length,
            data: {
                users
            },
        });
    }catch (error){
        return next(new HttpError("Could not retrieve users", 500));
    }

});


const getUser = catchAsync(async (req, res, next) => {
    try {
        const userId = req.params.id;

        const user = await User.findOne({_id : userId});
        res.status(200).json({
            success: true,
            data : {
               user
            },
        });
    }catch (error){
        return next(new HttpError("Could not retrieve user", 500));
    }

});


const forgotPassword = catchAsync(async (req, res, next) => {
    const clientUrl = req.rawHeaders[req.rawHeaders.length - 5];

    let user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new HttpError("There is no user with this email address", 500));
    }

    let resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    let resetURL = `${clientUrl}reset-password/${resetToken}`;

    const message = `Your password reset token is :- \n\n ${resetUrl} \n\nIf you have not requested this email then, please ignore it.`;

    try {
        await sendEmail({
        email: user.email,
        subject: "Your Password Reset Token (valid for 15 minutes)",
        message,
    });
    res.status(200).json({
      status: "ok",
      message: "Token sent to your email!",
    });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
    return next( new HttpError("There was an error sending the email.",500));
  }
});



const resetPassword = catchAsync(async (req, res, next) => {
  try {
    const token = req.params.token;
    if (!token || typeof token !== 'string') {
      return next(new HttpError('Invalid reset token', 400));
    }

    // 2. Hash the token securely using a more robust algorithm:
    let resetToken = user.createPasswordResetToken();

    // 3. Find user with matching hashed token and valid expiration:
    const user = await User.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() }, // Use $gt for greater than
    });

    if (!user) {
      return next(new HttpError('Invalid or expired reset token', 400));
    }

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    //let resetURL = `${clientUrl}reset-password/${resetToken}`;
    //let message = `Forget your password ? click the link below to reset it. \n${resetURL}.\nIf you didn't forget your password, please ignore this email !!!`;
    //await resetPasswordEmail(user.email, token, process.env.BASE_URL);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error); // Log the error for debugging
    return next(new HttpError('Internal server error', 500));
  }
});

export { signUp, login, getAllUsers, getUser, resetPassword, forgotPassword};
