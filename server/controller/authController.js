import { hashPassword, comparePassword } from "../utils/hash.js";
import jwt from "jsonwebtoken";

import db from "../config/db.js";        


export const getTeachers = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT userid AS id, name, email FROM users WHERE role = 'teacher' AND isActive = 1"
    );
    return res.json({ teachers: rows });
  } catch (err) {
    console.error("getTeachers error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
 
export const signup = async (req, res) => {
  const { name, email, password, confirmPassword, role, teacher_id } = req.body;

  if (!name || !email || !password || !confirmPassword || !role) {
    return res.status(400).json({ msg: "All fields required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ msg: "Passwords do not match" });
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

    // 2) If student and teacher_id provided — verify teacher exists and is teacher role
    let teacherIdToSave = null;
    if (role === "student") {
      if (!teacher_id) {
        return res.status(400).json({ msg: "Student must select a teacher" });
      }
      const [teacherRows] = await db.promise().query(
        "SELECT userid FROM users WHERE userid = ? AND role = 'teacher'",
        [teacher_id]
      );
      if (teacherRows.length === 0) {
        return res.status(400).json({ msg: "Selected teacher not found" });
      }
      teacherIdToSave = teacher_id;
    }

    // 3) hash password
    const hashed = await hashPassword(password);

    // 4) insert
    const [result] = await db.promise().execute(
      "INSERT INTO users (name, email, password, role, teacher_id, isActive) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashed, role, teacherIdToSave, 1]
    );

    return res.status(201).json({
      msg: "Signup successful",
      user: { id: result.insertId, name, email, role, teacher_id: teacherIdToSave }
    });
  } catch (err) {
    console.error("signup error:", err);
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
