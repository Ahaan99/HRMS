export const attachClient = (req, res, next) => {
  try {
    // comes from your auth middleware (JWT verify)
    const clientId = req.user?.clientId;

    if (!clientId) {
      return res.status(401).json({
        success: false,
        message: "Client context missing",
      });
    }

    // attach for controllers
    req.clientId = clientId;

    next();
  } catch (err) {
    console.error("attachClient error:", err);
    return res.status(500).json({
      success: false,
      message: `Server error: ${err.message}`,
    });
  }
};