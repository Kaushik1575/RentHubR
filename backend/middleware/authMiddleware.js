const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = 'your-secret-key'; // Use the same secret key as server-new.js

// Middleware to verify user token
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('VerifyToken: No auth header');
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log('VerifyToken: No token in auth header');
        return res.status(401).json({ error: 'Invalid token format' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check user status in database
        const { data: user, error } = await supabase
            .from('users')
            .select('is_blocked')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            console.error('VerifyToken: User lookup failed', error);
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.is_blocked) {
            console.log('VerifyToken: User is blocked');
            return res.status(403).json({ error: 'Account blocked', code: 'USER_BLOCKED' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('VerifyToken: Invalid token', error.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Admin middleware
const verifyAdminToken = async (req, res, next) => {
    console.log('verifyAdminToken called');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decoded);
        const { data: user, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', decoded.id)
            .single();
        console.log('User from DB:', user, 'Error:', error);
        if (error || !user || !user.is_admin) {
            console.log('Not authorized as admin');
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.log('Invalid token:', error);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = {
    verifyToken,
    verifyAdminToken,
    JWT_SECRET
};
