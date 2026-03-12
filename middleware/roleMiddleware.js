const authorize = (...roles) => {

  return (req, res, next) => {

    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    next();
  };

};

module.exports = authorize;