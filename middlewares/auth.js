import HttpError from "../utils/http-error.js";
import { catchAsync } from "../utils/catchAsync.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const isAuthenticatedUser = catchAsync(async (req, res, next) => {

    const token = req.cookies.token;
    /*console.log(req.cookies);
    console.log(token);
    console.log("req.cookies and token");*/

    if (!token) {
        return next(new HttpError("Please Login to access this resource", 401));
    }

    const decodedData = await jwt.verify(token, process.env.JWT_SECRET);
    /*console.log(decodedData);
    console.log("decodeData from auth.js");*/
    req.user = await User.findById(decodedData.userId);

    next();
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
