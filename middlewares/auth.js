import HttpError from "../utils/http-error.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const isAuthenticatedUser = catchAsync(async (req, res, next) => {
  //TODO - Changed req.cookies => undefined to req.user
  const { token } = req.cookies;
  if (!token){
    return next(new HttpError("Please Login to access this resource", 401));
  }
  
  const decodedData = await jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decodedData.id);
  
  next();
});

const authorizeRoles = (...roles) => {
  return (req, res, next)=> {
    // TODO - Value of req
    console.log(req);
    if (!roles.includes(req.user.role)){
      return next(new HttpError(`Role: ${req.user.role} is not allowed to access this request`, 401));
    }
    next();
  }
};

export {isAuthenticatedUser, authorizeRoles};
