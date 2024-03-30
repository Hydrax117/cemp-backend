import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      public_id: { 
      type: String,
      required: true,
      },
      url: {
          type: String,
          required: true,
      },
    },
   role: {
      type: Boolean,
      required: true,
      enum: ["member", "community-admin"],
      default: "member",
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

//Generating password reset token with crypto
userSchema.methods.createPasswordResetToken = function(){
    let resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
}

const User = mongoose.model("User", userSchema);

export default User;
