import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    regNo : {
        type : String,
        require : false,
        unique : true
    },
    adminId: {
        type: String,
        required: false,
        default: function() {
            
            if (this.role === "admin") {
                return this._id.toString();  
            }
            return null;  
        }
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["admin","instructor", "student"],
        default:'admin'
    },
    enrolledCourses:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Course'
        }
    ],
    photoUrl:{
        type:String,
        default:""
    }
},{timestamps:true});

export const User = mongoose.model("User", userSchema);