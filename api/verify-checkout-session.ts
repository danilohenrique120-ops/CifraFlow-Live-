// Serverless Function para Vercel
// Endpoint: POST /api/verify-checkout-session
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

  const { sessionId } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId é obrigatório.' });
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

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });

    const isPaid = session.payment_status === 'paid' || session.status === 'complete';

    return res.status(200).json({
      success: isPaid,
      isPaid,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email || session.customer_email,
      tier: session.metadata?.tier || 'pro_band',
      billingCycle: session.metadata?.billingCycle || 'annual',
      userId: session.client_reference_id || session.metadata?.userId
    });
  } catch (error: any) {
    console.error('Verify checkout session error:', error);
    return res.status(500).json({ error: error.message || 'Erro ao verificar sessão no Stripe.' });
  }
}
