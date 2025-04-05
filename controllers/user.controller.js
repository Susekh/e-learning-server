import {User} from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";

export const register = async (req,res) => {
    try {
       
        const {name, email, password} = req.body;
        if(!name || !email || !password){
            return res.status(400).json({
                success:false,
                message:"All fields are required."
            })
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({
                success:false,
                message:"User already exist with this email."
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newuser = await User.create({
            name,
            email,
            password:hashedPassword
        });
        newuser.adminId = newuser._id;
        return res.status(201).json({
            success:true,
            message:"Account created successfully."
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to register"
        })
    }
}

export const addMember = async (req, res) => {
    try {
      const { name, email, password, role, regNo } = req.body;
      const { id } = req;
  
      const currentUser = await User.findById(id);
  
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to add members. Only admins can add members.",
        });
      }
  
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          success: false,
          message: "All fields are required (name, email, password, role).",
        });
      }
  
      const validRoles = ["student", "instructor"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Role must be 'student' or 'instructor'.",
        });
      }
  
     
      if (role === "student" && !regNo) {
        return res.status(400).json({
          success: false,
          message: "Registration number (regNo) is required for students.",
        });
      }
  
   
      if (role === "student" && regNo) {
        const existingRegNo = await User.findOne({ regNo });
        if (existingRegNo) {
          return res.status(400).json({
            success: false,
            message: "A user already exists with this registration number.",
          });
        }
      }
  
   
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        adminId : id,
        regNo: role === "student" ? regNo : undefined, 
      });
  
      return res.status(201).json({
        success: true,
        message: "Account created successfully.",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Failed to register",
      });
    }
  };

export const login = async (req,res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"All fields are required."
            })
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({
                success:false,
                message:"Incorrect email or password"
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if(!isPasswordMatch){
            return res.status(400).json({
                success:false,
                message:"Incorrect email or password"
            });
        }
        generateToken(res, user, `Welcome back ${user.name}`);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to login"
        })
    }
}
export const logout = async (_,res) => {
    try {
        return res.status(200).cookie("token", "", {maxAge:0}).json({
            message:"Logged out successfully.",
            success:true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to logout"
        }) 
    }
}
export const getUserProfile = async (req,res) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId).select("-password").populate("enrolledCourses");
        if(!user){
            return res.status(404).json({
                message:"Profile not found",
                success:false
            })
        }
        return res.status(200).json({
            success:true,
            user
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to load user"
        })
    }
}
export const updateProfile = async (req,res) => {
    try {
        const userId = req.id;
        const {name , targetId} = req.body;
        const profilePhoto = req.file;

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message:"User not found",
                success:false
            }) 
        }


        // extract public id of the old image from the url is it exists;
        if(user.photoUrl){
            const publicId = user.photoUrl.split("/").pop().split(".")[0]; // extract public id
            deleteMediaFromCloudinary(publicId);
        }

        // upload new photo
        const cloudResponse = await uploadMedia(profilePhoto.path);
        const photoUrl = cloudResponse.secure_url;

        const updatedData = {name, photoUrl};
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {new:true}).select("-password");

        return res.status(200).json({
            success:true,
            user:updatedUser,
            message:"Profile updated successfully."
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to update profile"
        })
    }
}

export const updateProfileAdmin = async (req,res) => {
    try {
        const userId = req.id;
        const {name} = req.body;
        const profilePhoto = req.file;

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message:"User not found",
                success:false
            }) 
        }

        if(user.role !== "admin"){
            return res.json({
                success : false,
                message : "You are not authorized"
            });
        }

        // extract public id of the old image from the url is it exists;
        if(user.photoUrl){
            const publicId = user.photoUrl.split("/").pop().split(".")[0]; // extract public id
            deleteMediaFromCloudinary(publicId);
        }

        // upload new photo
        const cloudResponse = await uploadMedia(profilePhoto.path);
        const photoUrl = cloudResponse.secure_url;

        const updatedData = {name, photoUrl};
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {new:true}).select("-password");

        return res.status(200).json({
            success:true,
            user:updatedUser,
            message:"Profile updated successfully."
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to update profile"
        })
    }
}

export const getMembers = async (req, res) => {
    const id = req.id;

    try {
        // Find the user making the request (the admin)
        const user = await User.findById(id);
        
        // Check if the user exists and is an admin
        if (user && user.role === "admin") {
            // Ensure that the adminId matches req.id
            if (user.adminId.toString() === req.id) {
                
                // Query instructors and students where adminId matches req.id
                const instructors = await User.find({ role: "instructor", adminId: req.id });
                const students = await User.find({ role: "student", adminId: req.id });

                // Return the filtered instructors and students
                res.json({
                    teachers: instructors,
                    students: students
                });
            } else {
                // If adminId doesn't match, return unauthorized error
                return res.status(403).json({ message: "Unauthorized access, admin ID does not match." });
            }
        } else {
            // If the user is not an admin or doesn't exist
            return res.status(403).json({ message: "You do not have permission to view this information." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch members"
        });
    }
};

export const getProfileData = async (req, res) => {
    try {
        const id = res.body.id;

        const user = await User.findById(id);
        res.json({
            success: true,
            user,
            message : "profile data recieved"
        })
    } catch (error) {
        
    }
}


export const deleteMember = async (req, res) => {
    try {
      // Extracting the userId from the request parameters
      const { userId } = req.params;
  
      // Find the user by userId and delete
      const user = await User.findByIdAndDelete(userId);
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.log("Error at deleting user:", error);
      return res.status(200).json({ message: "Can't delete member" });
    }
  };