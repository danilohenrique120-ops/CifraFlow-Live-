// Serverless Function para Vercel / Next.js / Express
// Endpoint: POST /api/create-checkout-session

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, userId, userEmail, returnUrl } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: 'Stripe Secret Key não configurada nas variáveis de ambiente da Vercel.'
    });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: {
        userId
      },
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${returnUrl || 'https://cifraflowlive.com'}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl || 'https://cifraflowlive.com'}?canceled=true`
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    return res.status(500).json({ error: error.message });
  }
}
