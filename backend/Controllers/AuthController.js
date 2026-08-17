const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminModel = require("../Models/Admin");
const StudentModel = require("../Models/Student");
const FacultyModel = require("../Models/Faculty");

const AdminRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await AdminModel.findOne({ email });
        if (user) {
            return res.status(409).json({ 
                message: 'User already exists, you can login',
                success: false 
            });
        }
        
        const admin = new AdminModel({ name, email, password });
        admin.password = await bcrypt.hash(password, 10);
        await admin.save();
        
        res.status(201).json({
            message: "Signup successful",
            success: true
        });
    } catch (err) {
        console.error('Admin registration error:', err);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

const AdminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await AdminModel.findOne({ email });
        const errorMsg = 'Auth failed email or password is wrong';
        if (!user) {
            return res.status(403)
                .json({ message: errorMsg, success: false });
        }
        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403)
                .json({ message: errorMsg, success: false });
        }
        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200)
            .json({
                message: "Login Success",
                success: true,
                jwtToken,
                email,
                name: user.name,
                adminId: user._id
            });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500)
            .json({
                message: "Internal server error",
                success: false
            });
    }
};

// Faculty Registration 
const FacultyRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await FacultyModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: 'User already exists, you can login',
                success: false
            });
        }

        // Create new faculty, hash password before saving
        const faculty = new FacultyModel({ name, email, password });
        faculty.password = await bcrypt.hash(password, 10); // same salt rounds as Admin
        await faculty.save();

        res.status(201).json({
            message: "Faculty registered successfully",
            success: true
        });
    } catch (err) {
        console.error('Faculty registration error:', err);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Faculty Login
const FacultyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await FacultyModel.findOne({ email });
        const errorMsg = 'Auth failed email or password is wrong';

        if (!user) {
            return res.status(403).json({ message: errorMsg, success: false });
        }

        // Compare passwords with bcrypt.compare
        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403).json({ message: errorMsg, success: false });
        }

        // Generate JWT
        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login Success",
            success: true,
            jwtToken,
            email: user.email,
            name: user.name,
            facultyId: user._id
        });
    } catch (err) {
        console.error('Faculty login error:', err);
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

const StudentRegister = async (req, res) => {
    try {
        const { name, username, password } = req.body;
        const user = await StudentModel.findOne({ username });
        if (user) {
            return res.status(409)
                .json({ message: 'User already exists, you can login', 
                    success: false });
        }
        const student = new StudentModel({ name, username, password });
        student.password = await bcrypt.hash(password, 10);
        await student.save();
        res.status(201)
            .json({
                message: "Student registered successfully",
                success: true
            });
    } catch (err) {
        res.status(500)
            .json({
                message: "Internal server error",
                success: false
            });
    }
};

const StudentLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await StudentModel.findOne({ username });
        if (!user) return res.status(403).json({ message: 'Auth failed', success: false });

        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) return res.status(403).json({ message: 'Auth failed', success: false });

        const jwtToken = jwt.sign(
            { username: user.username, _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login Success",
            success: true,
            jwtToken,
            username: user.username,
            name: user.name,
            studentId: user._id
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

module.exports = {
    AdminRegister,
    AdminLogin,
    FacultyRegister,
    FacultyLogin,
    StudentRegister,
    StudentLogin
};
