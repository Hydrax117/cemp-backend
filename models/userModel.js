import mongoose from "mongoose";
import crypto from "crypto";
import validator from "validator";

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [validator.isEmail, "Please Enter a valid Email"],
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      // required: true,
      default:
        "https://res.cloudinary.com/formula-web-apps/image/upload/v1623766149/148-1486972_mystery-man-avatar-circle-clipart_kldmy3.jpg",
    },
    avatarPublicId: {
      type: String,
    },
    interests: [],
    bio: {
      type: String,
      default: "Hello World",
    },
    github: {
      type: String,
      default: "https://github.com",
    },
    portfolio: {
      type: String,
      default: "https://github.com",
    },
    contact: {
      type: String,
    },
    role: {
      type: String,
      required: true,
      enum: ["member", "community-admin"],
      default: "member",
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    interestedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Events" }],
  },

  { timestamps: true }
);

userSchema.index({
  fullName: "text",
  email: "text",
  github: "text",
  portfolio: "text",
  id: "text",
}); // Create text index

//Generating password reset token with crypto
userSchema.methods.createPasswordResetToken = function () {
  let resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;
