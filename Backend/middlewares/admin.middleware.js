const jwt = require('jsonwebtoken');

module.exports.authAdmin = (req, res, next) => {
  const token = req.headers.admintoken || req.cookies.adminToken;
  if (!token) return res.status(401).json({ message: 'Admin authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error('Not an admin');
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
};
