// Serverless Function para Vercel
// Endpoint: POST /api/check-subscription-by-email
import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: 'E-mail é obrigatório.' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

  if (!stripeSecretKey) {
    return res.status(500).json({
      error: 'Chave STRIPE_SECRET_KEY não configurada na Vercel.'
    });
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any
    });

    const cleanEmail = email.trim().toLowerCase();

    // 1. Procurar clientes com este e-mail no Stripe
    const customers = await stripe.customers.list({
      email: cleanEmail,
      limit: 10
    });

    for (const customer of customers.data) {
      // 2. Verificar assinaturas ativas ou em período de teste
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all',
        limit: 10
      });

      const activeSub = subscriptions.data.find(
        (sub) => sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSub) {
        return res.status(200).json({
          hasActiveSubscription: true,
          subscriptionId: activeSub.id,
          status: activeSub.status,
          currentPeriodEnd: activeSub.current_period_end * 1000,
          planName: 'Plano Pro'
        });
      }
    }

    return res.status(200).json({
      hasActiveSubscription: false
    });
  } catch (error: any) {
    console.error('Check subscription by email error:', error);
    return res.status(500).json({ error: error.message || 'Erro ao consultar assinaturas no Stripe.' });
  }
}
