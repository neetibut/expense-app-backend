const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header("x-auth-token");

  // Check if token is missing
  if (!token) {
    return res
      .status(401)
      .json({ msg: "No authentication token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error("Token verification error:", err.message);

    // Handle different types of token errors
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ msg: "Session expired, please log in again" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ msg: "Invalid authentication token" });
    } else {
      return res
        .status(500)
        .json({ msg: "Server error during authentication" });
    }
  }
};
