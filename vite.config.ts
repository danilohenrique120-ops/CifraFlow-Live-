import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-checkout-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/create-checkout-session') && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', chunk => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

                  // If real Stripe key is configured in env, create real Stripe session
                  if (stripeSecretKey) {
                    try {
                      const Stripe = (await import('stripe')).default;
                      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' as any });
                      const isAnnual = body.billingCycle === 'annual';
                      const isProBand = body.tier === 'pro_band' || body.tier === 'pro_ministry' || !body.tier;
                      const unitAmount = isProBand ? (isAnnual ? 19900 : 2490) : (isAnnual ? 9900 : 1490);
                      const planTitle = isProBand ? 'CifraSync Live - Plano Pro' : 'CifraSync Live - Pro Músico Solo';
                      const origin = body.returnUrl || 'http://localhost:3000';

                      const session = await stripe.checkout.sessions.create({
                        mode: 'subscription',
                        payment_method_types: ['card'],
                        customer_email: body.userEmail || undefined,
                        client_reference_id: body.userId || 'anonymous',
                        metadata: {
                          userId: body.userId || 'anonymous',
                          tier: isProBand ? 'pro_band' : 'pro_musician',
                          billingCycle: isAnnual ? 'annual' : 'monthly'
                        },
                        line_items: [{
                          price_data: {
                            currency: 'brl',
                            unit_amount: unitAmount,
                            recurring: { interval: isAnnual ? 'year' : 'month' },
                            product_data: {
                              name: planTitle,
                              description: isProBand
                                ? 'Acesso completo ao Live Band Sync, transposição em tempo real e salas de ensaio ilimitadas.'
                                : 'Repertórios ilimitados, transposição e ferramentas de palco para músico solo.'
                            }
                          },
                          quantity: 1
                        }],
                        success_url: `${origin}?session_id={CHECKOUT_SESSION_ID}&payment_success=true&tier=${isProBand ? 'pro_band' : 'pro_musician'}`,
                        cancel_url: `${origin}?payment_canceled=true`
                      });

                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ sessionId: session.id, url: session.url }));
                      return;
                    } catch (err: any) {
                      console.warn('Stripe local API error, falling back to dev simulation:', err.message);
                    }
                  }

                  // Localhost Test Simulation (when STRIPE_SECRET_KEY is not set in local .env)
                  const origin = body.returnUrl || 'http://localhost:3000';
                  const tier = body.tier || 'pro_band';
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    sessionId: 'cs_dev_mock_session',
                    url: `${origin}?session_id=cs_dev_mock_session&payment_success=true&tier=${tier}`
                  }));
                } catch (e: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e.message || 'Erro no middleware' }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
