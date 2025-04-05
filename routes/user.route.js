import express from "express";
import { addMember, deleteMember, getMembers, getProfileData, getUserProfile, login, logout, register, updateProfile, updateProfileAdmin } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/add-member").post(isAuthenticated, addMember);
router.route("/getMembers").get(isAuthenticated, getMembers);
router.route("/profile").get(isAuthenticated, getUserProfile);
router.route("/getprofiledata").get(isAuthenticated, getProfileData);
router.route("/delete/:userId").delete(deleteMember);
router.route("/profile/update").put(isAuthenticated, upload.single("profilePhoto"), updateProfile);

export default router;