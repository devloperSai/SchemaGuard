import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../middleware/error.middleware.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError("Please provide name, email and password", 400));
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError("Email already registered", 400));
    }

    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// FIX: previously returned the raw Mongoose doc (with `_id`), which didn't
// match the { id, name, email } shape login/register return. Normalize it so
// frontend code (auth.refresh() in lib/auth.ts) can rely on a consistent shape.
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};
