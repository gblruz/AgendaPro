const supabase = require('../database/supabase');

const professionalController = {
  // Criar profissional
  async create(req, res) {
    try {
      const { business_id, name, email, phone, bio, specialty, service_ids } = req.body;

      if (!business_id || !name) {
        return res.status(400).json({ error: 'Negócio e nome são obrigatórios' });
      }

      const { data: professional, error } = await supabase
        .from('professionals')
        .insert([{ 
          business_id, 
          name, 
          email, 
          phone, 
          bio, 
          specialty 
        }])
        .select()
        .single();

      if (error) throw error;

      // Associar serviços
      if (service_ids && service_ids.length > 0) {
        const links = service_ids.map(sid => ({
          professional_id: professional.id,
          service_id: sid
        }));
        await supabase.from('professional_services').insert(links);
      }

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

      let query = supabase
        .from('professionals')
        .select('*')
        .eq('active', true)
        .order('name');

      if (business_id) {
        query = query.eq('business_id', business_id);
      }

      const { data: professionals, error } = await query;
      if (error) throw error;

      // Buscar serviços de cada profissional
      for (const prof of professionals) {
        const { data: services } = await supabase
          .from('professional_services')
          .select('service_id, services:service_id (*)')
          .eq('professional_id', prof.id);

        prof.services = services?.map(ps => ps.services).filter(Boolean) || [];
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

      const { data: professional, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error || !professional) {
        return res.status(404).json({ error: 'Profissional não encontrado' });
      }

      // Buscar serviços
      const { data: services } = await supabase
        .from('professional_services')
        .select('service_id, services:service_id (*)')
        .eq('professional_id', id);

      professional.services = services?.map(ps => ps.services).filter(Boolean) || [];

      // Buscar disponibilidade
      const { data: availability } = await supabase
        .from('availability')
        .select('*')
        .eq('professional_id', id)
        .eq('active', true)
        .order('day_of_week')
        .order('start_time');

      professional.availability = availability || [];

      res.json({ professional });
    } catch (error) {
      console.error('Erro ao buscar profissional:', error);
      res.status(500).json({ error: 'Erro ao buscar profissional' });
    }
  },

  // Atualizar profissional
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, phone, bio, specialty, active, service_ids } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (bio !== undefined) updateData.bio = bio;
      if (specialty !== undefined) updateData.specialty = specialty;
      if (active !== undefined) updateData.active = active;

      const { data: professional, error } = await supabase
        .from('professionals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Atualizar serviços
      if (service_ids) {
        await supabase
          .from('professional_services')
          .delete()
          .eq('professional_id', id);

        if (service_ids.length > 0) {
          const links = service_ids.map(sid => ({
            professional_id: id,
            service_id: sid
          }));
          await supabase.from('professional_services').insert(links);
        }
      }

      res.json({
        message: 'Profissional atualizado com sucesso',
        professional
      });
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error);
      res.status(500).json({ error: 'Erro ao atualizar profissional' });
    }
  },

  // Deletar profissional (soft delete)
  async delete(req, res) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('professionals')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

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

      const { data: availability, error } = await supabase
        .from('availability')
        .insert([{ professional_id: id, day_of_week, start_time, end_time }])
        .select()
        .single();

      if (error) throw error;

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

      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', availabilityId)
        .eq('professional_id', id);

      if (error) throw error;

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
        const { data: service } = await supabase
          .from('services')
          .select('duration')
          .eq('id', service_id)
          .single();
        if (service) serviceDuration = service.duration;
      }

      // Dia da semana (0 = domingo)
      const dayOfWeek = new Date(date + 'T12:00:00').getDay();

      // Buscar disponibilidade do profissional
      const { data: availabilityList } = await supabase
        .from('availability')
        .select('*')
        .eq('professional_id', id)
        .eq('day_of_week', dayOfWeek)
        .eq('active', true);

      if (!availabilityList || availabilityList.length === 0) {
        return res.json({ slots: [] });
      }

      // Buscar agendamentos existentes
      const { data: appointments } = await supabase
        .from('appointments')
        .select('time, duration')
        .eq('professional_id', id)
        .eq('date', date)
        .in('status', ['pending', 'confirmed']);

      // Buscar bloqueios
      const { data: blockedSlots } = await supabase
        .from('blocked_slots')
        .select('start_time, end_time')
        .eq('professional_id', id)
        .eq('date', date);

      // Gerar slots disponíveis
      const slots = [];
      for (const avail of availabilityList) {
        let currentTime = new Date(`${date}T${avail.start_time}`);
        const endDateTime = new Date(`${date}T${avail.end_time}`);

        while (currentTime < endDateTime) {
          const timeStr = currentTime.toTimeString().slice(0, 5);
          const slotEndTime = new Date(currentTime.getTime() + serviceDuration * 60000);

          // Verificar conflitos com agendamentos
          const hasConflict = (appointments || []).some(apt => {
            const aptStart = new Date(`${date}T${apt.time}`);
            const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
            return (currentTime < aptEnd && slotEndTime > aptStart);
          });

          // Verificar bloqueios
          const isBlocked = (blockedSlots || []).some(block => {
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
