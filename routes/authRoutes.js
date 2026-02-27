const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const { User } = require("../models");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "e1d9ccb2b1f06ec0ed31b95f7d344d9ebbe7aa47da26af9652347654c0837bc5";

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, avatar_url } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      ...(avatar_url != null && avatar_url !== "" && { avatar_url }),
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, avatar_url: user.avatar_url ?? null },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Signup successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url ?? null }
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, avatar_url: user.avatar_url ?? null },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url ?? null }
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// PATCH /auth/edit-profile – update name and/or email (auth required)
router.patch("/edit-profile", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { username, email } = req.body;

    if (!username?.trim() && !email?.trim()) {
      return res.status(400).json({ message: "At least one of username or email is required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};

    if (username != null && String(username).trim() !== "") {
      updates.username = String(username).trim();
    }

    if (email != null && String(email).trim() !== "") {
      const newEmail = String(email).trim().toLowerCase();
      if (newEmail !== user.email) {
        const existing = await User.findOne({ where: { email: newEmail } });
        if (existing) {
          return res.status(409).json({ message: "Email already registered" });
        }
        updates.email = newEmail;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({
        message: "No changes",
        user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url ?? null }
      });
    }

    await user.update(updates);

    return res.status(200).json({
      message: "Profile updated successfully",
      user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url ?? null }
    });
  } catch (error) {
    return res.status(500).json({ message: "Edit profile failed", error: error.message });
  }
});

// PATCH /auth/change-password – change password (auth required)
router.patch("/change-password", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password required" });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    await user.update({ password: hashedPassword });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Change password failed", error: error.message });
  }
});

module.exports = router;
