const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'agendapro_secret_key_2026_secure_token';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Requer permissão de administrador.' });
  }
  next();
};

const professionalMiddleware = (req, res, next) => {
  if (req.user.role !== 'professional' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Requer permissão de profissional.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, professionalMiddleware };
