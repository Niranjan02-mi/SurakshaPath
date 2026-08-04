require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// Import Models
const User = require('./models/User');
const Location = require('./models/Location');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/tourist_auth?authSource=admin';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB via Docker'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
// 1. Register (Step 1: Generate OTP and Send Email)
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const isDemo = email.startsWith('demo.');

        // Create user (unverified unless it's a demo account)
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'tourist',
            verificationCode: isDemo ? null : otp,
            isVerified: isDemo
        });

        await newUser.save();

        if (isDemo) {
            // Bypass email and immediately return token for Demo Accounts
            const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(201).json({
                message: 'Demo user registered successfully!',
                token,
                user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
            });
        }

        // Send OTP Email for real users
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Suraksha Path - Verification Code',
            html: `<h3>Welcome to Suraksha Path!</h3>
                   <p>Your verification code is: <strong>${otp}</strong></p>
                   <p>Please enter this code in the app to verify your account.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error('Error sending OTP:', error);
        });

        res.status(201).json({
            message: 'Registration successful! Please check your email for the OTP.',
            email: newUser.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// 1.5. Verify OTP and Send QR Code (Step 2)
app.post('/api/verify', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found.' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified.' });
        if (user.verificationCode !== otp) return res.status(400).json({ message: 'Invalid verification code.' });

        // Mark as verified
        user.isVerified = true;
        user.verificationCode = null; // Clear OTP
        await user.save();

        // Generate QR Code Payload matching frontend Police Scanner rules
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(user._id.toString() + Date.now().toString()).digest('hex');
        const cid = 'bafybei' + hash.substring(0, 52);
        const validTillDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        const touristId = `SP-${new Date().getFullYear()}-${user._id.toString().substring(0, 8).toUpperCase()}`;

        const qrPayloadObject = {
            id: touristId,
            name: user.name,
            hash: hash,
            validTill: validTillDate.toISOString(),
            emergencyContact: 'Online Registration',
            entryPoint: 'Digital Portal',
            cid: cid
        };

        const qrData = JSON.stringify(qrPayloadObject);
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);

        // Send QR Code & Confirmation Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Suraksha Path - Your Official Digital ID',
            html: `
            <div style="font-family: 'Courier New', Courier, monospace; background-color: #f4ebd9; padding: 40px; color: #1a4d2e;">
                <div style="max-width: 500px; margin: 0 auto;">
                    <h2 style="font-size: 28px; margin-bottom: 20px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">YOUR DIGITAL ID</h2>
                    
                    <div style="border: 4px solid #1a4d2e; padding: 20px; text-align: center; margin-bottom: 20px; background-color: #f4ebd9;">
                        <p style="margin-top: 0; margin-bottom: 15px; color: #3b7c5a;">Scan to verify offline</p>
                        <img src="cid:qrcode" alt="QR Code" style="width: 250px; height: 250px; border: 4px solid #1a4d2e;" />
                        <p style="margin-bottom: 0; margin-top: 15px; color: #3b7c5a; font-size: 14px;">Works offline — no internet needed for verification</p>
                    </div>

                    <div style="border: 4px solid #1a4d2e; background-color: #fbbc04;">
                        <div style="display: flex; justify-content: space-between; padding: 15px; border-bottom: 2px solid #1a4d2e;">
                            <span style="font-weight: bold;">NAME</span>
                            <span style="font-weight: 900; font-size: 18px;">${user.name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 15px; border-bottom: 2px solid #1a4d2e;">
                            <span style="font-weight: bold;">TOURIST ID</span>
                            <span style="font-weight: 900; font-size: 18px; color: #d93025;">${touristId}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 15px;">
                            <span style="font-weight: bold;">VALID TILL</span>
                            <span style="font-weight: 900; font-size: 18px;">${validTillDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>

                    
                    <p style="margin-top: 30px; font-size: 14px; text-align: center; color: #3b7c5a;">
                        Keep this ID safe. You can show this email to any police officer or hotel staff for instant verification.
                    </p>
                </div>
            </div>
            `,
            attachments: [
                {
                    filename: 'Digital_ID_QRCode.png',
                    content: qrCodeDataUrl.split("base64,")[1],
                    encoding: 'base64',
                    cid: 'qrcode' // same cid value as in the html img src
                }
            ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error('Error sending QR code:', error);
        });

        // Create JWT token for immediate login
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Verification successful!',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during verification.' });
    }
});

// 1.8. Resend OTP
app.post('/api/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found.' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified.' });

        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.verificationCode = otp;
        await user.save();

        // Send OTP Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Suraksha Path - New Verification Code',
            html: `<h3>Welcome to Suraksha Path!</h3>
                   <p>Your NEW verification code is: <strong>${otp}</strong></p>
                   <p>Please enter this code in the app to verify your account.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error('Error resending OTP:', error);
        });

        res.status(200).json({ message: 'A new verification code has been sent to your email.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while resending OTP.' });
    }
});

// 2. Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Check if verified
        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Create JWT token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(200).json({
            message: 'Logged in successfully!',
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ==========================================
// 4. HARDWARE TRACKING (ESP-NOW / LORA)
// ==========================================

// 4.1. Gateway Ping Ingestion (Hardware pushes data here)
app.post('/api/tracking/ping', async (req, res) => {
    try {
        const { touristId, lat, lng, sosStatus } = req.body;
        
        if (!touristId || !lat || !lng) {
            return res.status(400).json({ message: 'Missing required tracking data' });
        }

        const newLocation = new Location({
            touristId,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            sosStatus: sosStatus === true || sosStatus === 'true'
        });

        await newLocation.save();
        res.status(201).json({ success: true, message: 'Ping recorded' });
    } catch (err) {
        console.error('Tracking Ping Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 4.2. Frontend Live Polling (Dashboard pulls data from here)
app.get('/api/tracking/live', async (req, res) => {
    try {
        // Aggregate to get the LATEST location for each unique touristId
        const latestLocations = await Location.aggregate([
            { $sort: { timestamp: -1 } },
            { 
                $group: { 
                    _id: "$touristId", 
                    lat: { $first: "$lat" }, 
                    lng: { $first: "$lng" },
                    sosStatus: { $first: "$sosStatus" },
                    timestamp: { $first: "$timestamp" }
                } 
            }
        ]);

        res.status(200).json(latestLocations.map(loc => ({
            touristId: loc._id,
            lat: loc.lat,
            lng: loc.lng,
            sosStatus: loc.sosStatus,
            timestamp: loc.timestamp
        })));
    } catch (err) {
        console.error('Fetch Live Tracking Error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend Auth server running on http://localhost:${PORT}`);
});
