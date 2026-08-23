const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;

        // Ensure user is a sponsor
        if (!req.user.isSponsor) {
            return res.status(403).json({ error: 'Access denied. Sponsor role required.' });
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token', message: err.message });
    }
};

module.exports = { verifyToken };
