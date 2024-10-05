import HttpError from "../utils/http-error.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const isAuthenticatedUser = catchAsync(async (req, res, next) => {
  let token = req.headers["x-auth-token"] || req.body.token || req.query.token;
  /*console.log(req.cookies);
    console.log(token);
    console.log("req.cookies and token");*/

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      const user = await User.findOne({ _id: decoded?.userId }).select(
        "-password"
      );
      req.user = user;
      // console.log(user);

      if (!user) {
        return res.send("Authentication failed");
      }
      return next();
    } catch (error) {
      return res
        .status(401)
        .json({ msg: "Invalid User Auth Token", err: error.message });
    }
  } else {
    return res
      .status(400)
      .json({ msg: "No Auth Token Found", err: "No Auth Token Found" });
  }

  //   if (!token) {
  //     return next(new HttpError("Please Login to access this resource", 401));
  //   }

  //   const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  //   /*console.log(decodedData);
  //     console.log("decodeData from auth.js");*/
  //   var user = await User.findById(decodedData.userId);
  //   if (!user) {
  //     return res.send("Authentication failed");
  //   }
  //   return next();

  //   next();
});

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // TODO - Value of req
    if (!roles.includes(req.user.role)) {
      return next(
        new HttpError(
          `Role: ${req.user.role} is not allowed to access this request`,
          401
        )
      );
    }
    next();
  };
};

export { isAuthenticatedUser, authorizeRoles };
