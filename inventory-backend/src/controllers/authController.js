const prisma = require('../config/db'); // Required to check the database for blocked status

exports.googleCallback = (req, res) => {

  res.redirect(`${process.env.CLIENT_URL}/personal`);
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) console.error("Session destruction error:", err);
      res.clearCookie('connect.sid'); // Note: 'connect.sid' is the default Express session cookie name
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
  });
};
exports.getCurrentUser = async (req, res) => {

  if (req.user) {
    try {
      const freshUser = await prisma.user.findUnique({
        where: { id: req.user.id }
      });
      if (!freshUser || freshUser.isBlocked) {
        return req.logout((err) => {
          if (err) console.error("Logout error:", err);

          if (req.session) {
            req.session.destroy();
          }
          res.clearCookie('connect.sid'); // Delete the cookie from their browser

          return res.status(403).json({ message: 'USER_BLOCKED' });
        });
      }
      return res.status(200).json({ isAuthenticated: true, user: freshUser });
    } catch (error) {
      console.error("Error fetching current user:", error);
      return res.status(500).json({ message: 'Server error' });
    }
  } else {
    return res.status(401).json({ isAuthenticated: false, message: 'Not authenticated' });
  }
};