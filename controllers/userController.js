import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import HttpError from "../utils/http-error.js";
import {generateToken, createHashedPassword, comparePassword} from "../utils/authHelper.js";

const signUp = catchAsync(async (req, res, next) => {
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

    const token = await generateToken({newUser._id, newUser.email});

    res.status(200).json({
        success: true,
        message: "User Created Successfully",
        user: {
            userId: newUser._id,
            fullname: newUser.fullname,
            email: newUser.email,
            token
        }
    }).catch(error){
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

        const token = await generateToken({existingUser._id, existingUser.email});

        res.status(201).json({
            success: true,
            mesaage: "User Login Successful",
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


export {signUp, login};
