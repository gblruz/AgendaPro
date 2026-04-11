const supabase = require('../database/supabase');

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
        notes,
        client_name,
        client_email,
        client_phone 
      } = req.body;

      const client_id = req.user.id;

      if (!business_id || !service_id || !date || !time) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }

      // Buscar informações do serviço
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', service_id)
        .single();

      if (serviceError || !service) {
        return res.status(404).json({ error: 'Serviço não encontrado' });
      }

      // Verificar se o horário está disponível (anti-colisão)
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

      // Buscar nome do cliente
      let resolved_client_name = client_name || null;
      if (!resolved_client_name) {
        const { data: user } = await supabase
          .from('users')
          .select('name')
          .eq('id', client_id)
          .single();
        resolved_client_name = user?.name || null;
      }

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([{
          business_id,
          client_id,
          professional_id,
          service_id,
          date,
          time,
          duration: service.duration,
          price: service.price,
          notes,
          status: 'confirmed',
          client_name: resolved_client_name,
          client_email,
          client_phone
        }])
        .select()
        .single();

      if (error) throw error;

      // Enriquecer com nomes
      appointment.service_name = service.name;
      appointment.professional_name = professional_name;

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

      let query = supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (name, color, duration),
          professionals:professional_id (name)
        `)
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (business_id) {
        query = query.eq('business_id', business_id);
      }

      if (client_id) {
        query = query.eq('client_id', client_id);
      }

      if (professional_id) {
        query = query.eq('professional_id', professional_id);
      }

      if (date) {
        query = query.eq('date', date);
      }

      if (start_date && end_date) {
        query = query.gte('date', start_date).lte('date', end_date);
      }

      if (status) {
        query = query.eq('status', status);
      }

      // Se for cliente, mostrar apenas seus agendamentos
      if (userRole === 'client') {
        query = query.eq('client_id', userId);
      }

      const { data: appointments, error } = await query;
      if (error) throw error;

      // Mapear nomes para campos desnormalizados
      const enriched = (appointments || []).map(a => ({
        ...a,
        service_name: a.services?.name || a.service_name,
        professional_name: a.professionals?.name || a.professional_name,
        services: undefined,
        professionals: undefined
      }));

      res.json({ appointments: enriched });
    } catch (error) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({ error: 'Erro ao listar agendamentos' });
    }
  },

  // Obter agendamento por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (name, color, duration),
          professionals:professional_id (name)
        `)
        .eq('id', id)
        .single();

      if (error || !appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Verificar permissão
      if (req.user.role === 'client' && appointment.client_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      appointment.service_name = appointment.services?.name || appointment.service_name;
      appointment.professional_name = appointment.professionals?.name || appointment.professional_name;

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

      // Buscar agendamento existente
      const { data: existing, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Verificar permissão
      if (req.user.role === 'client' && existing.client_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Cliente só pode cancelar
      if (req.user.role === 'client' && status !== 'cancelled') {
        return res.status(403).json({ error: 'Cliente só pode cancelar agendamentos' });
      }

      const updateData = {};
      if (date !== undefined) updateData.date = date;
      if (time !== undefined) updateData.time = time;
      if (professional_id !== undefined) updateData.professional_id = professional_id;
      if (notes !== undefined) updateData.notes = notes;
      if (status !== undefined) updateData.status = status;

      const { data: appointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Agendamento atualizado com sucesso',
        appointment
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

      const { data: existing, error: fetchError } = await supabase
        .from('appointments')
        .select('client_id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      if (req.user.role === 'client' && existing.client_id !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

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

      const { data: existing, error: fetchError } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (error) throw error;

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

      const { data: existing, error: fetchError } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      const { error } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;

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

      // Total de agendamentos não cancelados
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('business_id', business_id)
        .neq('status', 'cancelled');

      if (error) throw error;

      const totalAppointments = appointments.length;
      const uniqueClients = new Set(appointments.map(a => a.client_id || a.client_email)).size;

      let revenue = 0;
      const dailyMap = {};
      const serviceMap = {};

      for (const apt of appointments) {
        revenue += Number(apt.price) || 0;

        // Stats diárias
        const day = apt.date;
        if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, count: 0 };
        dailyMap[day].revenue += Number(apt.price) || 0;
        dailyMap[day].count += 1;

        // Stats por serviço
        const svcName = apt.service_name || 'Desconhecido';
        if (!serviceMap[svcName]) serviceMap[svcName] = { name: svcName, count: 0 };
        serviceMap[svcName].count += 1;
      }

      res.json({
        data: {
          totalAppointments,
          revenue,
          uniqueClients,
          dailyStats: Object.values(dailyMap),
          serviceStats: Object.values(serviceMap).sort((a, b) => b.count - a.count)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }
};

module.exports = appointmentController;
