const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../database/connection');

const appointmentController = {
  // Criar agendamento
  async create(req, res) {
    try {
      const { 
        business_id, 
        professional_id, 
        service_id, 
        date, 
        time, 
        notes 
      } = req.body;

      const client_id = req.user.id;

      if (!business_id || !service_id || !date || !time) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }

      // Buscar informações do serviço
      const service = await get('SELECT * FROM services WHERE id = ?', [service_id]);
      if (!service) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }

      // Verificar se o horário está disponível
      if (professional_id) {
        const existingAppointment = await get(
          `SELECT id FROM appointments 
           WHERE professional_id = ? AND date = ? AND time = ? 
           AND status IN ('pending', 'confirmed')`,
          [professional_id, date, time]
        );

        if (existingAppointment) {
          return res.status(400).json({ error: 'Horário não disponível' });
        }
      }

      const appointmentId = uuidv4();
      await run(
        `INSERT INTO appointments (id, business_id, client_id, professional_id, service_id, date, time, duration, price, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [appointmentId, business_id, client_id, professional_id, service_id, date, time, service.duration, service.price, notes]
      );

      const appointment = await get(`
        SELECT a.*, 
               s.name as service_name,
               u.name as client_name,
               u.phone as client_phone,
               p.user_id as professional_user_id,
               pu.name as professional_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        JOIN users u ON a.client_id = u.id
        LEFT JOIN professionals p ON a.professional_id = p.id
        LEFT JOIN users pu ON p.user_id = pu.id
        WHERE a.id = ?
      `, [appointmentId]);

      res.status(201).json({
        message: 'Agendamento criado com sucesso',
        appointment
      });
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      res.status(500).json({ error: 'Erro ao criar agendamento' });
    }
  },

  // Listar agendamentos
  async list(req, res) {
    try {
      const { business_id, client_id, professional_id, date, status, start_date, end_date } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      let query = `
        SELECT a.*, 
               s.name as service_name,
               u.name as client_name,
               u.phone as client_phone,
               pu.name as professional_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        JOIN users u ON a.client_id = u.id
        LEFT JOIN professionals p ON a.professional_id = p.id
        LEFT JOIN users pu ON p.user_id = pu.id
        WHERE 1=1
      `;
      const params = [];

      if (business_id) {
        query += ' AND a.business_id = ?';
        params.push(business_id);
      }

      if (client_id) {
        query += ' AND a.client_id = ?';
        params.push(client_id);
      }

      if (professional_id) {
        query += ' AND a.professional_id = ?';
        params.push(professional_id);
      }

      if (date) {
        query += ' AND a.date = ?';
        params.push(date);
      }

      if (start_date && end_date) {
        query += ' AND a.date BETWEEN ? AND ?';
        params.push(start_date, end_date);
      }

      if (status) {
        query += ' AND a.status = ?';
        params.push(status);
      }

      // Se for cliente, mostrar apenas seus agendamentos
      if (userRole === 'client') {
        query += ' AND a.client_id = ?';
        params.push(userId);
      }

      query += ' ORDER BY a.date DESC, a.time DESC';

      const appointments = await all(query, params);

      res.json({ appointments });
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({ error: 'Erro ao listar agendamentos' });
    }
  },

  // Obter agendamento por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const appointment = await get(`
        SELECT a.*, 
               s.name as service_name,
               u.name as client_name,
               u.phone as client_phone,
               u.email as client_email,
               pu.name as professional_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        JOIN users u ON a.client_id = u.id
        LEFT JOIN professionals p ON a.professional_id = p.id
        LEFT JOIN users pu ON p.user_id = pu.id
        WHERE a.id = ?
      `, [id]);

      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Verificar permissão
      if (req.user.role === 'client' && appointment.client_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json({ appointment });
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      res.status(500).json({ error: 'Erro ao buscar agendamento' });
    }
  },

  // Atualizar agendamento
  async update(req, res) {
    try {
      const { id } = req.params;
      const { date, time, professional_id, notes, status } = req.body;

      const appointment = await get('SELECT * FROM appointments WHERE id = ?', [id]);
      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Verificar permissão
      if (req.user.role === 'client' && appointment.client_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Cliente só pode cancelar, não alterar detalhes
      if (req.user.role === 'client' && status !== 'cancelled') {
        return res.status(403).json({ error: 'Cliente só pode cancelar agendamentos' });
      }

      await run(
        `UPDATE appointments SET 
          date = ?, time = ?, professional_id = ?, notes = ?, status = ?, 
          updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [date, time, professional_id, notes, status, id]
      );

      const updatedAppointment = await get(`
        SELECT a.*, 
               s.name as service_name,
               u.name as client_name,
               u.phone as client_phone,
               pu.name as professional_name
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        JOIN users u ON a.client_id = u.id
        LEFT JOIN professionals p ON a.professional_id = p.id
        LEFT JOIN users pu ON p.user_id = pu.id
        WHERE a.id = ?
      `, [id]);

      res.json({
        message: 'Agendamento atualizado com sucesso',
        appointment: updatedAppointment
      });
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      res.status(500).json({ error: 'Erro ao atualizar agendamento' });
    }
  },

  // Cancelar agendamento
  async cancel(req, res) {
    try {
      const { id } = req.params;

      const appointment = await get('SELECT * FROM appointments WHERE id = ?', [id]);
      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Verificar permissão
      if (req.user.role === 'client' && appointment.client_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      await run(
        "UPDATE appointments SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );

      res.json({ message: 'Agendamento cancelado com sucesso' });
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      res.status(500).json({ error: 'Erro ao cancelar agendamento' });
    }
  },

  // Confirmar agendamento
  async confirm(req, res) {
    try {
      const { id } = req.params;

      const appointment = await get('SELECT * FROM appointments WHERE id = ?', [id]);
      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      await run(
        "UPDATE appointments SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );

      res.json({ message: 'Agendamento confirmado com sucesso' });
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      res.status(500).json({ error: 'Erro ao confirmar agendamento' });
    }
  },

  // Completar agendamento
  async complete(req, res) {
    try {
      const { id } = req.params;

      const appointment = await get('SELECT * FROM appointments WHERE id = ?', [id]);
      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      await run(
        "UPDATE appointments SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );

      res.json({ message: 'Agendamento marcado como concluído' });
    } catch (error) {
      console.error('Erro ao completar agendamento:', error);
      res.status(500).json({ error: 'Erro ao completar agendamento' });
    }
  },

  // Estatísticas de agendamentos
  async stats(req, res) {
    try {
      const { business_id } = req.query;

      if (!business_id) {
        return res.status(400).json({ error: 'ID do negócio é obrigatório' });
      }

      // Total de agendamentos por status
      const statusStats = await all(
        `SELECT status, COUNT(*) as count FROM appointments 
         WHERE business_id = ? GROUP BY status`,
        [business_id]
      );

      // Agendamentos por dia (últimos 30 dias)
      const dailyStats = await all(
        `SELECT date, COUNT(*) as count FROM appointments 
         WHERE business_id = ? AND date >= date('now', '-30 days')
         GROUP BY date ORDER BY date`,
        [business_id]
      );

      // Faturamento por mês
      const revenueStats = await all(
        `SELECT strftime('%Y-%m', date) as month, COALESCE(SUM(price), 0) as revenue 
         FROM appointments 
         WHERE business_id = ? AND status = 'completed'
         GROUP BY month ORDER BY month DESC LIMIT 12`,
        [business_id]
      );

      // Serviços mais agendados
      const topServices = await all(
        `SELECT s.name, COUNT(*) as count FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.business_id = ?
         GROUP BY a.service_id ORDER BY count DESC LIMIT 5`,
        [business_id]
      );

      res.json({
        statusStats,
        dailyStats,
        revenueStats,
        topServices
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
};

module.exports = appointmentController;
