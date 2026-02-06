const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "e1d9ccb2b1f06ec0ed31b95f7d344d9ebbe7aa47da26af9652347654c0837bc5";

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = auth;
