const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
  let authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("Access denied");

  // support both "Bearer <token>" and raw token
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    authHeader = authHeader.slice(7).trim();
  }

  try {
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET || "secretkey");

    req.user = {
      id: decoded.id
    };

    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).send("Invalid token");
  }
};