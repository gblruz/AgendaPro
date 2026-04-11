const supabase = require('../database/supabase');

/**
 * Controller para rotas públicas (sem autenticação).
 * Usado pela página de booking do cliente.
 */
const publicController = {
  // Obter dados do negócio para a página de booking
  async getBusinessById(req, res) {
    try {
      const { id } = req.params;

      const { data: business, error } = await supabase
        .from('businesses')
        .select('id, name, description, address, phone, email, logo, theme_color, working_hours')
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error || !business) {
        return res.status(404).json({ error: 'Negócio não encontrado' });
      }

      res.json({ business });
    } catch (error) {
      console.error('Erro ao buscar negócio público:', error);
      res.status(500).json({ error: 'Erro ao buscar negócio' });
    }
  },

  // Listar serviços de um negócio (público)
  async getBusinessServices(req, res) {
    try {
      const { id } = req.params;

      const { data: services, error } = await supabase
        .from('services')
        .select('id, name, description, duration, price, color')
        .eq('business_id', id)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      res.json({ services: services || [] });
    } catch (error) {
      console.error('Erro ao listar serviços públicos:', error);
      res.status(500).json({ error: 'Erro ao listar serviços' });
    }
  },

  // Listar profissionais de um negócio (público)
  async getBusinessProfessionals(req, res) {
    try {
      const { id } = req.params;

      const { data: professionals, error } = await supabase
        .from('professionals')
        .select('id, name, specialty, avatar')
        .eq('business_id', id)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      res.json({ professionals: professionals || [] });
    } catch (error) {
      console.error('Erro ao listar profissionais públicos:', error);
      res.status(500).json({ error: 'Erro ao listar profissionais' });
    }
  },

  // Obter horários disponíveis de um profissional (público)
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

      const dayOfWeek = new Date(date + 'T12:00:00').getDay();

      // Buscar disponibilidade
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

      // Gerar slots
      const slots = [];
      for (const avail of availabilityList) {
        let currentTime = new Date(`${date}T${avail.start_time}`);
        const endDateTime = new Date(`${date}T${avail.end_time}`);

        while (currentTime < endDateTime) {
          const timeStr = currentTime.toTimeString().slice(0, 5);
          const slotEndTime = new Date(currentTime.getTime() + serviceDuration * 60000);

          const hasConflict = (appointments || []).some(apt => {
            const aptStart = new Date(`${date}T${apt.time}`);
            const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
            return (currentTime < aptEnd && slotEndTime > aptStart);
          });

          const isBlocked = (blockedSlots || []).some(block => {
            const blockStart = new Date(`${date}T${block.start_time}`);
            const blockEnd = new Date(`${date}T${block.end_time}`);
            return (currentTime < blockEnd && slotEndTime > blockStart);
          });

          if (!hasConflict && !isBlocked) {
            slots.push(timeStr);
          }

          currentTime = new Date(currentTime.getTime() + 30 * 60000);
        }
      }

      res.json({ slots });
    } catch (error) {
      console.error('Erro ao buscar slots públicos:', error);
      res.status(500).json({ error: 'Erro ao buscar horários' });
    }
  },

  // Criar agendamento público (cliente sem login)
  async createAppointment(req, res) {
    try {
      const { 
        business_id, 
        professional_id, 
        service_id, 
        date, 
        time, 
        client_name, 
        client_email, 
        client_phone, 
        notes 
      } = req.body;

      if (!business_id || !service_id || !date || !time || !client_name) {
        return res.status(400).json({ error: 'Dados incompletos. Nome, serviço, data e horário são obrigatórios.' });
      }

      // Buscar serviço
      const { data: service, error: svcError } = await supabase
        .from('services')
        .select('*')
        .eq('id', service_id)
        .single();

      if (svcError || !service) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }

      // Anti-colisão
      if (professional_id) {
        const { data: conflicts } = await supabase
          .from('appointments')
          .select('id')
          .eq('professional_id', professional_id)
          .eq('date', date)
          .eq('time', time)
          .in('status', ['pending', 'confirmed']);

        if (conflicts && conflicts.length > 0) {
          return res.status(400).json({ error: 'Horário não disponível' });
        }
      }

      // Buscar nome do profissional
      let professional_name = null;
      if (professional_id) {
        const { data: prof } = await supabase
          .from('professionals')
          .select('name')
          .eq('id', professional_id)
          .single();
        professional_name = prof?.name || null;
      }

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([{
          business_id,
          professional_id,
          service_id,
          date,
          time,
          duration: service.duration,
          price: service.price,
          status: 'pending',
          client_name,
          client_email,
          client_phone,
          notes
        }])
        .select()
        .single();

      if (error) throw error;

      appointment.service_name = service.name;
      appointment.professional_name = professional_name;

      res.status(201).json({
        message: 'Agendamento criado com sucesso! Aguarde a confirmação.',
        appointment
      });
    } catch (error) {
      console.error('Erro ao criar agendamento público:', error);
      res.status(500).json({ error: 'Erro ao criar agendamento' });
    }
  }
};

module.exports = publicController;
