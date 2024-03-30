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
    /*avatar: {
      public_id: { 
      type: String,
      required: true,
      },
      url: {
          type: String,
          required: true,
          default: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.dreamstime.com%2Fillustration%2Fprofile-pic.html&psig=AOvVaw0bw6vX_WlxJpJsShwoTRBS&ust=1711920655968000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCND1p8j3nIUDFQAAAAAdAAAAABAJ",
      },
    },*/
   role: {
      type: String,
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
    let resetToken = crypto.randomBytes(24).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
}

const User = mongoose.model("User", userSchema);

export default User;
