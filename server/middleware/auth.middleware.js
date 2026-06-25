import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "./error.middleware.js";

// TEMP DEV BYPASS — remove once the frontend login screen issues real JWTs.
// While SKIP_AUTH=true, any request without a Bearer token is attached to a
// fixed demo user instead of being rejected. A real token still works fine,
// so flipping SKIP_AUTH to false later requires zero code changes here.
let demoUserPromise = null;
const getOrCreateDemoUser = async () => {
  if (!demoUserPromise) {
    demoUserPromise = (async () => {
      let user = await User.findOne({ email: "demo@schemaguard.dev" });
      if (!user) {
        user = await User.create({
          name: "Demo User",
          email: "demo@schemaguard.dev",
          password: "demo12345",
        });
      }
      return user;
    })();
  }
  return demoUserPromise;
};

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      if (process.env.SKIP_AUTH === "true") {
        req.user = await getOrCreateDemoUser();
        return next();
      }
      return next(new AppError("Not authorized, no token", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new AppError("User no longer exists", 401));

    req.user = user;
    next();
  } catch (err) {
    if (process.env.SKIP_AUTH === "true") {
      req.user = await getOrCreateDemoUser();
      return next();
    }
    next(err);
  }
};
