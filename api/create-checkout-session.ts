// Serverless Function para Vercel
// Endpoint: POST /api/create-checkout-session
import Stripe from 'stripe';

const STRIPE_PRICES = {
  monthly: 'price_1U9q744Ms9CHJegrDCcskGlP',
  annual: 'price_1U9q8i4Ms9CHJegrgGtIK2Oa'
};

export default async function handler(req: any, res: any) {
  // Set CORS headers
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

  const { priceId, userId, userEmail, returnUrl, tier, billingCycle } = req.body || {};

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

  if (!stripeSecretKey) {
    return res.status(500).json({
      error: 'Chave STRIPE_SECRET_KEY não configurada na Vercel! Por favor, acesse o painel da Vercel (Project Settings > Environment Variables) e adicione a variável STRIPE_SECRET_KEY.'
    });
  }

  try {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any
    });

    const origin = returnUrl || 'https://cifrae.vercel.app';

    // Determine plan details & pricing
    const isAnnual = billingCycle === 'annual';
    const isProBand = tier === 'pro_band' || tier === 'pro_ministry' || !tier;

    // Use configured Stripe Price ID if available or fallback
    const targetPriceId = priceId && priceId.startsWith('price_')
      ? priceId
      : (isAnnual ? STRIPE_PRICES.annual : STRIPE_PRICES.monthly);

    let lineItem: any;

    if (targetPriceId) {
      lineItem = {
        price: targetPriceId,
        quantity: 1
      };
    } else {
      const unitAmount = isProBand ? (isAnnual ? 19900 : 2490) : (isAnnual ? 9900 : 1490);
      const planTitle = isProBand ? 'Cifraê - Plano Pro' : 'Cifraê - Pro Músico Solo';

      lineItem = {
        price_data: {
          currency: 'brl',
          unit_amount: unitAmount,
          recurring: {
            interval: isAnnual ? 'year' : 'month'
          },
          product_data: {
            name: planTitle,
            description: isProBand
              ? 'Acesso completo ao Live Band Sync, transposição em tempo real e salas de ensaio ilimitadas.'
              : 'Repertórios ilimitados, transposição e ferramentas de palco para músico solo.'
          }
        },
        quantity: 1
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      client_reference_id: userId || 'anonymous',
      allow_promotion_codes: true,
      metadata: {
        userId: userId || 'anonymous',
        tier: isProBand ? 'pro_band' : 'pro_musician',
        billingCycle: isAnnual ? 'annual' : 'monthly'
      },
      line_items: [lineItem],
      success_url: `${origin}?session_id={CHECKOUT_SESSION_ID}&payment_success=true&tier=${isProBand ? 'pro_band' : 'pro_musician'}`,
      cancel_url: `${origin}?payment_canceled=true`
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    return res.status(500).json({ error: error.message || 'Erro ao criar sessão do Stripe' });
  }
}
