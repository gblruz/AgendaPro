const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../database/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'agendapro_secret_key_2026_secure_token';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const authController = {
  // Registro de usuário
  async register(req, res) {
    try {
      const { name, email, password, phone, role = 'client' } = req.body;

      // Validações
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }

      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const { data: user, error } = await supabase
        .from('users')
        .insert([{ name, email, password: hashedPassword, phone, role }])
        .select('id, name, email, phone, role, created_at')
        .single();

      if (error) throw error;

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        user,
        token
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  },

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      // Gerar token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Remover senha do retorno
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login realizado com sucesso',
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro ao realizar login' });
    }
  },

  // Obter perfil do usuário logado
  async me(req, res) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, phone, role, avatar, created_at')
        .eq('id', req.user.id)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ user });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },

  // Atualizar perfil
  async updateProfile(req, res) {
    try {
      const { name, phone, avatar } = req.body;
      const userId = req.user.id;

      const { data: user, error } = await supabase
        .from('users')
        .update({ name, phone, avatar, updated_at: new Date() })
        .eq('id', userId)
        .select('id, name, email, phone, role, avatar, created_at')
        .single();

      if (error) throw error;

      res.json({
        message: 'Perfil atualizado com sucesso',
        user
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  },

  // Alterar senha
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
      }

      // Verificar senha atual
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      // Hash nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword, updated_at: new Date() })
        .eq('id', userId);

      if (updateError) throw updateError;

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  }
};

module.exports = authController;
