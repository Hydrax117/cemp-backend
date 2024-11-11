import User from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendEmail } from "../utils/email.js";
import { sendToken } from "../utils/jwtToken.js";
import HttpError from "../utils/http-error.js";
import {
  generateToken,
  createHashedPassword,
  comparePassword,
} from "../utils/authHelpers.js";
import { validatePassword, validEmail } from "../utils/password.js";
import crypto from "crypto";
import eventModel from "../models/eventModel.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import validator from "validator";

const currentDate = new Date().toLocaleString();
const helpEmail = process.env.EMAIL_USER;

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    resource_type: "auto",
    allowed_formats: ["jpg", "png"],
  },
});

const signUp = catchAsync(async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      github,
      contact,
      avatar,
      ...others
    } = req.body;

    if (!fullName || fullName.trim().length === 0) {
      return next(new HttpError("Fullname cannot be empty!", 400));
    }

    // Validate GitHub URL (optional)

    if (github && !validator.isURL(github)) {
      return next(new HttpError("Invalid GitHub URL format.", 400));
    }

    // Validate Contact (optional) - Let's assume it's a phone number or email
    if (contact && !validator.isMobilePhone(contact) && !validator.isEmail(contact)) {
      return next(new HttpError("Invalid contact format. It should be a valid phone number or email.", 400));
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match!",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must contain Uppercase, LowerCase, Symbol, Number and must be at least 8 characters!",
      });
    }

    if (!password || password.trim().length === 0) {
      return next(new HttpError("Password cannot be empty", 400));
    }

    const existingUser = await User.findOne({ email }).select("email");

    if (existingUser) {
      return res
        .status(401)
        .json({ message: "another user exist with is email" });
    }

    const passwordHash = await createHashedPassword(password);

    let avatarUrl = null;
    let avatarPublicId = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      avatarUrl = result.secure_url;
      avatarPublicId = result.public_id;
    }

    const newUser = await User.create({
      fullName,
      email,
      password: passwordHash,
      avatar: avatarUrl,
      avatarPublicId: avatarPublicId,
      ...others,
    });

    try {
      await sendEmail({
        email: newUser.email,
        subject: "Sign-up Notification",
        message: `Dear ${newUser.fullName}, Welcome to React community. Thank you for joining us, You have Successfully registered on ${currentDate}.If you did not initiate this,send an email to admin.react.community.project@gmail.com`,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      return next(new HttpError("Message not sent Successfully", 500));
    }

    sendToken(newUser, 200, res);
  } catch (error) {
    console.error("Error creating user:", error);
    return next(new HttpError("Unable to create user, try again.", 500));
  }
});

const login = catchAsync(async (req, res, next) => {
  // console.log("login");
  try {
    const { email, password } = req.body;

    if (!email || email.trim().length === 0) {
      return next(new HttpError("Email cannot be empty", 400));
    }

    if (!password || password.length === 0) {
      return next(new HttpError("Password cannot be empty", 400));
    }

    const existingUser = await User.findOne({ email }).select("password");
    const existingUser1 = await User.findOne({ email }).select("-password");

    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "User does not exsist with this email" });
    }

    // TODO - Compare password to existingUser password
    if (!(await comparePassword(password, existingUser.password))) {
      // return nexts(new HttpError("Passwords do not match", 400));
      return res.status(400).json({ message: "Invalid Password" });
    }

    try {
      await sendEmail({
        email: existingUser1.email,
        subject: "Login Notification",
        message: `Dear ${existingUser1.fullName}, Your Login was Successful. Welcome Back! You have logged in successfully to React Developer Community on ${currentDate}. If you did not initiate this, change your password immediately or send an email to admin.react.community.project@gmail.com`,
      });
    } catch (error) {
      return next(new HttpError("Message not sent Successfully", 500));
    }

    /*const token = await generateToken(existingUser._id);*/

    sendToken(existingUser1, 200, res);
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
        users,
      },
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError("Could not retrieve users", 500));
  }
});

const getUser = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findOne({ _id: userId });
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
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
    return next(new HttpError("There was an error sending the email.", 500));
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  try {
    const token = req.params.token;
    console.log(req.params);
    if (!token || typeof token !== "string") {
      return next(new HttpError("Invalid reset token", 400));
    }
    console.log(token);

    // 2. Hash the token securely using a more robust algorithm:
    let passwordResetToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    console.log(passwordResetToken);

    // 3. Find user with matching hashed token and valid expiration:
    const user = await User.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    console.log(user);

    if (!user) {
      return next(new HttpError("Invalid or expired reset token", 400));
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
        message,
      });
    } catch (error) {
      return next(new HttpError("There was an error sending the email.", 500));
    }
    res.status(200).json({
      success: true,
      message: "Password Reset Successfull",
    });
  } catch (error) {
    console.error("Error resetting password:", error); // Log the error for debugging
    return next(new HttpError("Internal server error", 500));
  }
});

const updateUser = catchAsync(async (req, res, next) => {
  try {
    const existingUser = await User.findById(req.user.id);
    if (!existingUser) {
      return next(new HttpError("User not found", 404));
    }

    const newUserData = {
      ...req.body,
    };

    // Handle avatar upload if a new file is provided
    if (req.file) {
      try {
        // Delete the old avatar from Cloudinary if it exists
        if (existingUser.avatarPublicId) {
          await cloudinary.uploader.destroy(existingUser.avatarPublicId);
        }

        // Upload new avatar
        const result = await cloudinary.uploader.upload(req.file.path);
        newUserData.avatar = result.secure_url;
        newUserData.avatarPublicId = result.public_id;
      } catch (error) {
        console.error("Error handling avatar:", error);
        return next(new HttpError("Error updating avatar", 500));
      }
    }
    // TODO - req.user.id = req.user.userId
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "User Updated Successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    return next(new HttpError("User Update was Unsuccessfull", 500));
  }
});

const updateUserRole = catchAsync(async (req, res, next) => {
  const newUserData = {
    ...req.body,
  };

  try {
    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      success: true,
      message: "User Role Updated Successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    return next(new HttpError("User Role Update was Unsuccessfull", 500));
  }
});

const deleteUser = catchAsync(async (req, res, next) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);

    if (!userId) {
      res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    res.status(202).json({
      success: true,
      message: "User Deleted Successfully",
    });
  } catch (error) {
    return next(new HttpError("User Deletion Unsuccessfull", 500));
  }
});

const logout = catchAsync(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

const updatePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, password, confirmPassword } = req.body;
  // TODO - req.user.id
  const user = await User.findById(req.user.id).select("+password");

  if (password !== confirmPassword) {
    return next(new HttpError("Passwords do not match!", 400));
  }

  if (!(await comparePassword(oldPassword, user.password))) {
    return next(new HttpError("Old Password incorrect", 401));
  }

  user.password = await createHashedPassword(password);
  await user.save();
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: "Password Updated Successfully",
    user,
  });
});

const searchUser = catchAsync(async (req, res, next) => {
  const query = req.query.text;
  try {
    const searchCriteria = {
      $text: { $search: query },
    };

    console.log(query);
    console.log(searchCriteria);

    if (!query) {
      return next(new HttpError("Search term cannot be empty", 404));
    }

    const users = await User.find(searchCriteria).select(
      "id fullName email github portfolio"
    );

    if (users.length === 0) {
      return next(new HttpError("No results for your search", 404));
    }

    res.status(200).json({
      success: true,
      data: {
        users,
      },
    });
  } catch (error) {
    console.log(error);
    return next(new HttpError("An Error was Encountered", 500));
  }
});

const registeredEvents = catchAsync(async (req, res, next) => {
  const userId = req.user._id || req.query.id;
  console.log("id");
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 events per page

  try {
    const totalEvents = await eventModel.countDocuments({
      interestedUsers: userId,
    }); // Count total events
    const events = await eventModel
      .find({ interestedUsers: userId })
      .skip((page - 1) * limit) // Skip events for previous pages
      .limit(limit) // Limit results to current page
      .sort({ date: 1 }); // Sort by date (optional)
    const totalPages = Math.ceil(totalEvents / limit);

    res.json({
      status: "success",
      events: events,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    return next(new HttpError(err.message));
  }
});

export {
  signUp,
  login,
  getAllUsers,
  getUser,
  resetPassword,
  forgotPassword,
  updateUser,
  deleteUser,
  logout,
  updatePassword,
  updateUserRole,
  searchUser,
  registeredEvents,
};
