import mongoose from "mongoose";

const generateRegNo = () => {
  return Math.floor(Math.random() * 1000000).toString();
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    regNo: {
      type: String,
      required: false,
      unique: true,
      default: generateRegNo,
    },
    adminId: {
      type: String,
      required: false,
      default: function () {
        if (this.role === "admin") {
          return this._id.toString();
        }
        return null;
      },
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "instructor", "student"],
      default: "admin",
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    photoUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
