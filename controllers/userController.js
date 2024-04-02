import User from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendEmail } from "../utils/email.js";
import HttpError from "../utils/http-error.js";
import {generateToken, createHashedPassword, comparePassword} from "../utils/authHelpers.js";
import { validatePassword, validEmail } from "../utils/password.js";
import crypto from "crypto";

const signUp = catchAsync(async (req, res, next) => {
    try {

        const { fullName, email, password, confirmPassword, github, contact, avatar, ...others }  = req.body;
        
        if (!fullName || fullName.trim().length === 0){
            return next(new HttpError("Fullname cannot be empty!", 400));
        }
        
        if (!github || github.trim().length === 0){
            return next(new HttpError("Github url cannot be empty!", 400));
        }

        if (!contact || contact.trim().length === 0){
            return next(new HttpError("Contact cannot be empty!", 400));
        }
        
        if (password !== confirmPassword) {
            return next(new HttpError("Passwords do not match!", 400));
        }
        
        if (!validatePassword(password)) {
            return next(new HttpError("Password must contain Uppercase, LowerCase, Symbol, Number and must be at least 8 characters!", 400));
        }

        /* Email Validation with Regular Expression
        if (!validEmail(email)) {
            return next(new HttpError("Invalid email address!", 400));
        }*/

        if (!password || password.trim().length === 0){
            return next(new HttpError("Password cannot be empty", 400));
        }

        const existingUser = await User.findOne({email});

        if (existingUser){
            return next(new HttpError("User already exists!", 400));
        }

        const passwordHash = await createHashedPassword(password);

        const newUser = await User.create({
            fullName,
            email,
            password: passwordHash,
            github,
            contact,
            ...others,
        });

        try {
            await sendEmail({
                email: newUser.email,
                subject: "Sign-up Notification",
                message: `Dear ${newUser.fullName}, \nWelcome to React community. Thank you for joining us`,
              
            })
        }catch (error){
            console.error("Error sending email:", error);
            return next(new HttpError("Message not sent Successfully", 500));
       }

        const token = await generateToken(newUser._id, newUser.email);
        console.log(token);

        res.status(200).cookie("token", token).json({
            success: true,
            message: "User Created Successfully",
            user: {
                userId: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
                bio: newUser.bio,
                avatar: newUser.avatar,
                specialty: newUser.specialty,
                interests: newUser.interests,
                github: newUser.github,
                portfolio: newUser.portfolio,
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

        if (!password || password.length === 0){
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
                message: `Dear ${existingUser.fullName}, Your Login was Successful`,
        })
        }catch (error){
            return next(new HttpError("Message not sent Successfully", 500));
       }


        const token = await generateToken(existingUser._id, existingUser.email);

        res.status(201).cookie(token).json({
            success: true,
            message: "User Login Successful",
            user: {
                userId: existingUser._id,
                fullName: existingUser.fullName,
                email: existingUser.email,
                role: existingUser.role,
                bio: existingUser.bio,
                avatar: existingUser.avatar,
                specialty: existingUser.specialty,
                interests: existingUser.interests,
                github: existingUser.github,
                portfolio: existingUser.portfolio,
                token,
            },
        });
        } catch (error) {
            return next(new HttpError("Unable to login, try again", 500));
        }

});


const getAllUsers = catchAsync(async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            length: users.length,
            data: {
                users
            },
        });
    }catch (error){
      console.log(error);
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
    const clientUrl = process.env.BASE_URL;

    let user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new HttpError("There is no user with this email address", 500));
    }

    let resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    let resetURL = `${clientUrl}/api/users/reset-password/${resetToken}`;

    const message = `Your password reset token is: \n\n ${resetURL} \n\nIf you have not requested this email then, please ignore it.`;

    try {
        await sendEmail({
        email: user.email,
        subject: "React community Password Reset Token (valid for 15 minutes)",
        message,
    });
    res.status(200).json({
      success: true,
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
    console.log(req.params);
    if (!token || typeof token !== 'string') {
      return next(new HttpError('Invalid reset token', 400));
    }
    console.log(token);

    // 2. Hash the token securely using a more robust algorithm:
    let passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
    console.log(passwordResetToken);

    // 3. Find user with matching hashed token and valid expiration:
    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    console.log(user);

    if (!user) {
      return next(new HttpError('Invalid or expired reset token', 400));
    }
    
    user.password = await createHashedPassword(req.body.password);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    const message = `Your password reset was successfull: \n\nIf you have not initiated this activity, please contact ${process.env.EMAIL_USER}.`;

    await user.save({ validateBeforeSave: false });
 
    try {
        await sendEmail({
        email: user.email,
        subject: "React Community Password Reset Successfull.",
        message,});
      
    } catch (error) {
      return next( new HttpError("There was an error sending the email.",500));
    }
    res.status(200).json({
      success: true,
      message: 'Password Reset Successfull'
    });
  } catch (error) {
    console.error('Error resetting password:', error); // Log the error for debugging
    return next(new HttpError('Internal server error', 500));
  }
});

const updateUser = catchAsync( async(req, res, next) => {
  try {
    const newUserData = {
      ...req.body
    };
   // TODO - req.user.id = req.user.userId
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true
    })
    res.status(200).json({
      success: true,
      message: "User Updated Successfully.",
      data: {
        user
      }
    })
  } catch (error){
    return next(new HttpError("User Update was Unsuccessfull", 500));
  }
});

const deleteUser = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    
    if (!userId){
      res.status(404).json({
        success: false,
        message: "User Not Found",
      })
    }
    
    res.status(202).json({
      success: true,
      message: "User Deleted Successfully"
    })
    
  } catch (error){
    return next(new HttpError("User Deletion Unsuccessfull", 500));
  }
});

const logout = catchAsync(async (req, res, next) => {
  res.cookie("token", null,  {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  
  res.status(200).json({
    success: true,
    message: "Logged Out"
  })
});

const updatePassword = catchAsync (async (req, res, next) => {
  const { oldPassword, password, confirmPassword } = req.body;
  // TODO - req.user.id
  const user = await User.findById(req.user.id).select("+password");
  
  if (password !== confirmPassword) {
    return next(new HttpError("Passwords do not match!", 400));
  }
        
  if (!(await comparePassword(oldPassword, user.password))){
    return next(new HttpError("Old Password incorrect", 401));
  }
  
  user.password = await createHashedPassword(password);
  await user.save();
  user.password = undefined;
  
  res.status(200).json({
    success: true,
    message: "Password Updated Successfully",
    user
  })
});

const searchUser = catchAsync (async (req, res, next) => {
  const query = req.query.text;
  try {
    const searchCriteria = { 
      $text: { $search: query 
      },
    };

    console.log(query);
    console.log(searchCriteria);
    
    if (!query){
      return next(new HttpError("Search term cannot be empty", 404));
    }
  
    const users = await User.find(searchCriteria).select("id fullName email github portfolio");
    
    if (users.length === 0){
      return next(new HttpError("No results for your search", 404));
    }
  
    res.status(200).json({
      success: true,
      data : {
        users
      }
    })
  }catch (error){
    console.log(error);
    return next(new HttpError("An Error was Encountered", 500));
  }
});

export { signUp, login, getAllUsers, getUser, resetPassword, forgotPassword, updateUser, deleteUser, logout, updatePassword, searchUser};
