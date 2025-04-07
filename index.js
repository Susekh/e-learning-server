import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./database/db.js";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({});

// call database connection here
connectDB();
const app = express();

const PORT = process.env.PORT || 3000;

// default middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// apis
app.get("/", (req, res) => res.json({ status: "working fine" }));
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
app.post("/chatbot", async (req, res) => {
  const { interests, pastEnrollment } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Suggest 3-5 specific online courses that the student can take to build a career based on their interests and past enrollments:\n- Interests: ${interests}\n- Past Enrollments: ${pastEnrollment}. Remember not to take any organisation name or suggestion to take that courses from, just mension the headings of the courses, its oppertunities and average salary someone expect while starting their carrier in that field in India in short and crisp way.`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const responseText = await result.response.text();

    res.json({ suggestions: responseText });
  } catch (error) {
    console.error("Gemini API error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch suggestions", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listen at port ${PORT}`);
});
