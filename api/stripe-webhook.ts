// Serverless Function para Vercel
// Endpoint: POST /api/stripe-webhook

export const config = {
  api: {
    bodyParser: false // Necessário para validação da assinatura bruta do Stripe
  }
};

async function getRawBody(readable: any): Promise<Buffer> {
  const chunks: any[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe webhook secrets não configuradas' });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any
    });

    const rawBody = await getRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    // Tratamento dos eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id || session.metadata?.userId;
        console.log(`[Stripe Webhook] Pagamento confirmado para usuário: ${userId}`);
        // Atualizar no Firestore: user.role = 'pro', subscription.status = 'active'
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        console.log(`[Stripe Webhook] Assinatura atualizada: ${subscription.id} - status: ${subscription.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log(`[Stripe Webhook] Assinatura cancelada: ${subscription.id}`);
        // Atualizar no Firestore: user.role = 'free', subscription.status = 'canceled'
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento não tratado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`[Stripe Webhook] Erro na validação:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
