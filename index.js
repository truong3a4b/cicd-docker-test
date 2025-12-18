const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const e = require("express");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Kết nối MongoDB với username là MSSV, password là MSSV, dbname là it4409
mongoose
  .connect(
    "mongodb+srv://20225420:20225420@20225420.1nnou8l.mongodb.net/it4409?retryWrites=true&w=majority&appName=20225420"
  )
  .then(() => console.log("Connected to MongoDB fgf"))
  .catch((err) => console.error("MongoDB Error:", err));

// TODO: Tạo Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên không được để trống"],
    minlength: [2, "Tên phải có ít nhất 2 ký tự"],
  },
  age: {
    type: Number,
    required: [true, "Tuổi không được để trống"],
    min: [0, "Tuổi phải >= 0"],
  },
  email: {
    type: String,
    required: [true, "Email không được để trống"],
    match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
    unique: [true, "Email đã tồn tại"],
  },
  address: {
    type: String,
  },
});
const User = mongoose.model("User", UserSchema);

// TODO: Implement API endpoints
app.get("/api/users", async (req, res) => {
  try {
    // Lấy query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    if (page <= 0 || limit <= 0) {
      return res.status(400).json({ error: "page và limit phải là số dương" });
    }
    if (limit > 50) {
      return res.status(400).json({ error: "limit tối đa là 50" });
    }

    // Tạo query filter cho search
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Tính skip
    const skip = (page - 1) * limit;

    //Sử dụng Promise.all cho truy vấn song song (find và countDocument)
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Trả về response
    res.json({
      page,
      limit,
      total,
      totalPages,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
app.post("/api/users", async (req, res) => {
  try {
    const { name, age, email, address } = req.body;
    if (!name || !age || !email) {
      return res.status(400).json({ error: "Tên, tuổi và email là bắt buộc" });
    }
    if (age < 0) {
      return res.status(400).json({ error: "Tuổi phải >= 0" });
    }

    // tuoi la so nguyen
    if (!Number.isInteger(age)) {
      return res.status(400).json({ error: "Tuổi phải là số nguyên" });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Email không hợp lệ" });
    }

    // Tạo user mới
    const newUser = await User.create({ name, age, email, address });
    res.status(201).json({
      message: "Tạo người dùng thành công",
      data: newUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, email, address } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, age, email, address },
      { new: true, runValidators: true } // Quan trọng
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json({
      message: "Cập nhật người dùng thành công",
      data: updatedUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
