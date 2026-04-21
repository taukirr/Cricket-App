const { jwtSecret } = require("../config");
const { readDatabase } = require("../lib/database");
const { verifyJwt } = require("../lib/token");

async function requireAuth(request, response, next) {
  const authorizationHeader = request.headers.authorization || "";
  const token = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = verifyJwt(token, jwtSecret);
    const database = await readDatabase();
    const user = database.users.find((item) => item.id === payload.sub);

    if (!user) {
      response.status(401).json({ message: "User not found" });
      return;
    }

    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    response.status(401).json({ message: error.message || "Invalid token" });
  }
}

module.exports = {
  requireAuth,
};
