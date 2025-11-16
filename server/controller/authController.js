import { hashPassword, comparePassword } from "../utils/hash.js";
import jwt from "jsonwebtoken";

// controllers/authController.js
import db from "../config/db.js";          // your mysql2 createPool export
 
export const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ msg: "All fields required" });
  }

  try {
    // 1) check existing email
    const [existing] = await db.promise().query(
      "SELECT userid FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // 2) hash password
    const hashed = await hashPassword(password);

    // 3) insert into MySQL (username column matches your table)
    const [result] = await db.promise().execute(
      "INSERT INTO users (username, email, password, role, isActive) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashed, role, 1]
    );

    // 4) return created user (without password)
    const userId = result.insertId;
    return res.status(201).json({
      msg: "Signup successful",
      user: { id: userId, name, email, role },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ msg: "Server error" });
  }
};




export const login = async (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
    if (err) return res.status(500).send(err);
    if (rows.length === 0)
      return res.status(404).json({ msg: "User not found" });

    const user = rows[0];

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch)
      return res.status(400).json({ msg: "Incorrect password" });

    // Create JWT token
    const token = jwt.sign(
      { userId: user.userid, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      msg: "Login successful",
      token,
      user: {
        id: user.userid,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  });
};

export const logout = async (req, res) => {
  // If JWT is stored in cookies, clear it
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: false });
  return res.json({ msg: "Logout successful" });
};
