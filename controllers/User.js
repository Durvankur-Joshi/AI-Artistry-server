import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import User from "../models/User.js"
import { createError } from "../error.js";


dotenv.config()

export const UserRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Create the new user with the hashed password
    const user = new User({
      name,
      email,
      password: hashedPassword, // Store the hashed password
    });

    const createdUser = await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: createdUser._id }, process.env.JWT, {
      expiresIn: "9999 years",
    });

    // Send response with the token
    return res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    console.log("Error: " + err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });
    // Check if user exists
    if (!user) {
      return next(createError(404, "User not found"));
    }
    console.log(user);
    // Check if password is correct
    const isPasswordCorrect = await bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT, {
      expiresIn: "9999 years",
    });

    return res.status(200).json({ token, user });
  } catch (error) {
    return next(error);
  }
};