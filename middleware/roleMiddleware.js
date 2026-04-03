const roleMiddleware = (requiredRole) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({
          message: "No role assigned",
        });
      }

      // 🔥 HANDLE BOTH CASES
      const userRole =
        typeof req.user.role === "object"
          ? req.user.role.name
          : req.user.role;

      console.log("USER ROLE:", userRole);
      console.log("REQUIRED ROLE:", requiredRole);

      if (userRole.toLowerCase() !== requiredRole.toLowerCase()) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Role middleware error",
      });
    }
  };
};

module.exports = roleMiddleware;