const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../database/supabase');

const stripeController = {
  // Criar sessão de checkout
  async createCheckoutSession(req, res) {
    try {
      const { priceId } = req.body;
      const userId = req.user.id;

      // Buscar informações do usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Criar sessão do Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer_email: user.email,
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pricing`,
        metadata: {
          userId: userId,
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
  },

  // Webhook para processar eventos do Stripe
  async webhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Lidar com o evento
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const subscriptionId = session.subscription;

      // Atualizar status do usuário no banco de dados
      // Aqui você pode adicionar uma coluna 'subscription_status' ou similar na tabela users ou businesses
      console.log(`Pagamento concluído para o usuário ${userId}. Assinatura: ${subscriptionId}`);
      
      // Exemplo de atualização (precisaria adicionar a coluna no banco)
      /*
      await supabase
        .from('users')
        .update({ subscription_id: subscriptionId, plan_active: true })
        .eq('id', userId);
      */
    }

    res.json({ received: true });
  }
};

module.exports = stripeController;
