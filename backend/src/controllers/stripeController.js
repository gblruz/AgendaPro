const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabase = require('../database/supabase');

const PLAN_NAMES = {
  [process.env.STRIPE_PRICE_BASIC]: 'Básico',
  [process.env.STRIPE_PRICE_PROFESSIONAL]: 'Profissional',
  [process.env.STRIPE_PRICE_ENTERPRISE]: 'Empresarial',
};

const stripeController = {
  // Criar sessão de checkout
  async createCheckoutSession(req, res) {
    try {
      const { priceId } = req.body;
      const userId = req.user.id;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID é obrigatório' });
      }

      // Buscar informações do usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, name, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Criar ou reutilizar Stripe Customer
      let customerId = user.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId }
        });
        customerId = customer.id;

        // Salvar o customer_id no banco
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }

      // Criar sessão do Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/#pricing`,
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
      console.error(`Webhook Signature Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = session.metadata.userId;
          const subscriptionId = session.subscription;
          const customerId = session.customer;

          // Buscar detalhes da subscription
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price?.id;
          const planName = PLAN_NAMES[priceId] || 'Desconhecido';

          // Salvar subscription no banco
          await supabase
            .from('subscriptions')
            .upsert([{
              user_id: userId,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              plan_name: planName,
              price_id: priceId,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            }], { onConflict: 'stripe_subscription_id' });

          // Atualizar usuário
          await supabase
            .from('users')
            .update({ 
              subscription_id: subscriptionId, 
              plan_name: planName, 
              plan_active: true,
              stripe_customer_id: customerId 
            })
            .eq('id', userId);

          console.log(`✅ Assinatura ativada: ${planName} para usuário ${userId}`);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const status = subscription.status === 'active' ? 'active' : 
                         subscription.status === 'past_due' ? 'past_due' : 
                         subscription.status === 'trialing' ? 'trialing' : 'inactive';

          await supabase
            .from('subscriptions')
            .update({ 
              status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);

          // Buscar user_id pela subscription
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (sub) {
            await supabase
              .from('users')
              .update({ plan_active: status === 'active' || status === 'trialing' })
              .eq('id', sub.user_id);
          }

          console.log(`🔄 Assinatura atualizada: ${subscription.id} → ${status}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;

          await supabase
            .from('subscriptions')
            .update({ status: 'cancelled' })
            .eq('stripe_subscription_id', subscription.id);

          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (sub) {
            await supabase
              .from('users')
              .update({ plan_active: false, plan_name: null, subscription_id: null })
              .eq('id', sub.user_id);
          }

          console.log(`❌ Assinatura cancelada: ${subscription.id}`);
          break;
        }

        default:
          console.log(`Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
    }

    res.json({ received: true });
  }
};

module.exports = stripeController;
