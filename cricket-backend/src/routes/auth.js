const express = require("express");
const { jwtExpiresInSeconds, jwtSecret } = require("../config");
const { readDatabase, updateDatabase } = require("../lib/database");
const { hashPassword, verifyPassword } = require("../lib/password");
const { signJwt } = require("../lib/token");
const { createId } = require("../utils/id");

const router = express.Router();

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function createAuthResponse(user) {
  const token = signJwt(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    jwtExpiresInSeconds
  );

  return {
    token,
    user: sanitizeUser(user),
  };
}

router.post("/register", async (request, response) => {
  const { name, email, password } = request.body || {};

  if (!name || !email || !password) {
    response.status(400).json({ message: "Name, email, and password are required" });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (password.length < 6) {
    response.status(400).json({ message: "Password must be at least 6 characters long" });
    return;
  }

  const database = await readDatabase();
  const existingUser = database.users.find((user) => user.email === normalizedEmail);

  if (existingUser) {
    response.status(409).json({ message: "An account already exists for this email" });
    return;
  }

  const { salt, hash } = hashPassword(password);
  const now = new Date().toISOString();
  const nextUser = {
    id: createId("user"),
    name: String(name).trim(),
    email: normalizedEmail,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: now,
  };

  await updateDatabase((currentDatabase) => ({
    ...currentDatabase,
    users: [...currentDatabase.users, nextUser],
  }));

  response.status(201).json(createAuthResponse(nextUser));
});

router.post("/login", async (request, response) => {
  const { email, password } = request.body || {};

  if (!email || !password) {
    response.status(400).json({ message: "Email and password are required" });
    return;
  }

  const database = await readDatabase();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = database.users.find((item) => item.email === normalizedEmail);

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    response.status(401).json({ message: "Invalid email or password" });
    return;
  }

  response.json(createAuthResponse(user));
});

module.exports = router;
