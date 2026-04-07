const { v4: uuidv4 } = require('uuid');
const { run, get, all } = require('../database/connection');

const professionalController = {
  // Criar profissional
  async create(req, res) {
    try {
      const { user_id, business_id, bio, specialty, service_ids } = req.body;

      if (!user_id || !business_id) {
        return res.status(400).json({ error: 'Usuário e negócio são obrigatórios' });
      }

      const professionalId = uuidv4();
      await run(
        `INSERT INTO professionals (id, user_id, business_id, bio, specialty) 
         VALUES (?, ?, ?, ?, ?)`,
        [professionalId, user_id, business_id, bio, specialty]
      );

      // Associar serviços
      if (service_ids && service_ids.length > 0) {
        for (const serviceId of service_ids) {
          await run(
            'INSERT INTO professional_services (professional_id, service_id) VALUES (?, ?)',
            [professionalId, serviceId]
          );
        }
      }

      const professional = await get(`
        SELECT p.*, u.name, u.email, u.phone, u.avatar 
        FROM professionals p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `, [professionalId]);

      res.status(201).json({
        message: 'Profissional criado com sucesso',
        professional
      });
    } catch (error) {
      console.error('Erro ao criar profissional:', error);
      res.status(500).json({ error: 'Erro ao criar profissional' });
    }
  },

  // Listar profissionais
  async list(req, res) {
    try {
      const { business_id } = req.query;

      let professionals;
      if (business_id) {
        professionals = await all(`
          SELECT p.*, u.name, u.email, u.phone, u.avatar 
          FROM professionals p
          JOIN users u ON p.user_id = u.id
          WHERE p.business_id = ? AND p.active = 1
        `, [business_id]);
      } else {
        professionals = await all(`
          SELECT p.*, u.name, u.email, u.phone, u.avatar 
          FROM professionals p
          JOIN users u ON p.user_id = u.id
          WHERE p.active = 1
        `);
      }

      // Buscar serviços de cada profissional
      for (const prof of professionals) {
        const services = await all(`
          SELECT s.* FROM services s
          JOIN professional_services ps ON s.id = ps.service_id
          WHERE ps.professional_id = ? AND s.active = 1
        `, [prof.id]);
        prof.services = services;
      }

      res.json({ professionals });
    } catch (error) {
      console.error('Erro ao listar profissionais:', error);
      res.status(500).json({ error: 'Erro ao listar profissionais' });
    }
  },

  // Obter profissional por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const professional = await get(`
        SELECT p.*, u.name, u.email, u.phone, u.avatar 
        FROM professionals p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ? AND p.active = 1
      `, [id]);

      if (!professional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }

      // Buscar serviços
      const services = await all(`
        SELECT s.* FROM services s
        JOIN professional_services ps ON s.id = ps.service_id
        WHERE ps.professional_id = ? AND s.active = 1
      `, [id]);

      // Buscar horários de disponibilidade
      const availability = await all(
        'SELECT * FROM availability WHERE professional_id = ? AND active = 1 ORDER BY day_of_week, start_time',
        [id]
      );

      res.json({ 
        professional: {
          ...professional,
          services,
          availability
        }
      });
    } catch (error) {
      console.error('Erro ao buscar profissional:', error);
      res.status(500).json({ error: 'Erro ao buscar profissional' });
    }
  },

  // Atualizar profissional
  async update(req, res) {
    try {
      const { id } = req.params;
      const { bio, specialty, active, service_ids } = req.body;

      const professional = await get('SELECT * FROM professionals WHERE id = ?', [id]);
      if (!professional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }

      await run(
        `UPDATE professionals SET 
          bio = ?, specialty = ?, active = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [bio, specialty, active, id]
      );

      // Atualizar serviços
      if (service_ids) {
        await run('DELETE FROM professional_services WHERE professional_id = ?', [id]);
        for (const serviceId of service_ids) {
          await run(
            'INSERT INTO professional_services (professional_id, service_id) VALUES (?, ?)',
            [id, serviceId]
          );
        }
      }

      const updatedProfessional = await get(`
        SELECT p.*, u.name, u.email, u.phone, u.avatar 
        FROM professionals p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
      `, [id]);

      res.json({
        message: 'Profissional atualizado com sucesso',
        professional: updatedProfessional
      });
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error);
      res.status(500).json({ error: 'Erro ao atualizar profissional' });
    }
  },

  // Deletar profissional
  async delete(req, res) {
    try {
      const { id } = req.params;

      const professional = await get('SELECT * FROM professionals WHERE id = ?', [id]);
      if (!professional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }

      await run('UPDATE professionals SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

      res.json({ message: 'Profissional removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover profissional:', error);
      res.status(500).json({ error: 'Erro ao remover profissional' });
    }
  },

  // Adicionar disponibilidade
  async addAvailability(req, res) {
    try {
      const { id } = req.params;
      const { day_of_week, start_time, end_time } = req.body;

      const availabilityId = uuidv4();
      await run(
        `INSERT INTO availability (id, professional_id, day_of_week, start_time, end_time) 
         VALUES (?, ?, ?, ?, ?)`,
        [availabilityId, id, day_of_week, start_time, end_time]
      );

      const availability = await get('SELECT * FROM availability WHERE id = ?', [availabilityId]);

      res.status(201).json({
        message: 'Disponibilidade adicionada com sucesso',
        availability
      });
    } catch (error) {
      console.error('Erro ao adicionar disponibilidade:', error);
      res.status(500).json({ error: 'Erro ao adicionar disponibilidade' });
    }
  },

  // Remover disponibilidade
  async removeAvailability(req, res) {
    try {
      const { id, availabilityId } = req.params;

      await run('DELETE FROM availability WHERE id = ? AND professional_id = ?', [availabilityId, id]);

      res.json({ message: 'Disponibilidade removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover disponibilidade:', error);
      res.status(500).json({ error: 'Erro ao remover disponibilidade' });
    }
  },

  // Obter horários disponíveis para agendamento
  async getAvailableSlots(req, res) {
    try {
      const { id } = req.params;
      const { date, service_id } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Data é obrigatória' });
      }

      // Buscar duração do serviço
      let serviceDuration = 60;
      if (service_id) {
        const service = await get('SELECT duration FROM services WHERE id = ?', [service_id]);
        if (service) {
          serviceDuration = service.duration;
        }
      }

      // Dia da semana (0 = domingo)
      const dayOfWeek = new Date(date).getDay();

      // Buscar disponibilidade do profissional
      const availability = await all(
        'SELECT * FROM availability WHERE professional_id = ? AND day_of_week = ? AND active = 1',
        [id, dayOfWeek]
      );

      if (availability.length === 0) {
        return res.json({ slots: [] });
      }

      // Buscar agendamentos existentes
      const appointments = await all(
        `SELECT time, duration FROM appointments 
         WHERE professional_id = ? AND date = ? AND status IN ('pending', 'confirmed')`,
        [id, date]
      );

      // Buscar bloqueios
      const blockedSlots = await all(
        `SELECT start_time, end_time FROM blocked_slots 
         WHERE professional_id = ? AND date = ?`,
        [id, date]
      );

      // Gerar slots disponíveis
      const slots = [];
      for (const avail of availability) {
        const startTime = avail.start_time;
        const endTime = avail.end_time;
        
        let currentTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(`${date}T${endTime}`);

        while (currentTime < endDateTime) {
          const timeStr = currentTime.toTimeString().slice(0, 5);
          const slotEndTime = new Date(currentTime.getTime() + serviceDuration * 60000);

          // Verificar se há conflito com agendamentos existentes
          const hasConflict = appointments.some(apt => {
            const aptStart = new Date(`${date}T${apt.time}`);
            const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
            return (currentTime < aptEnd && slotEndTime > aptStart);
          });

          // Verificar bloqueios
          const isBlocked = blockedSlots.some(block => {
            const blockStart = new Date(`${date}T${block.start_time}`);
            const blockEnd = new Date(`${date}T${block.end_time}`);
            return (currentTime < blockEnd && slotEndTime > blockStart);
          });

          if (!hasConflict && !isBlocked) {
            slots.push(timeStr);
          }

          // Avançar 30 minutos
          currentTime = new Date(currentTime.getTime() + 30 * 60000);
        }
      }

      res.json({ slots });
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      res.status(500).json({ error: 'Erro ao buscar horários disponíveis' });
    }
  }
};

module.exports = professionalController;
