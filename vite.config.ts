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
                      const targetPriceId = body.priceId || (isAnnual ? 'price_1U9q8i4Ms9CHJegrgGtIK2Oa' : 'price_1U9q744Ms9CHJegrDCcskGlP');
                      const origin = body.returnUrl || 'http://localhost:3000';

                      const session = await stripe.checkout.sessions.create({
                        mode: 'subscription',
                        payment_method_types: ['card'],
                        customer_email: body.userEmail || undefined,
                        client_reference_id: body.userId || 'anonymous',
                        allow_promotion_codes: true,
                        metadata: {
                          userId: body.userId || 'anonymous',
                          tier: isProBand ? 'pro_band' : 'pro_musician',
                          billingCycle: isAnnual ? 'annual' : 'monthly'
                        },
                        line_items: [{
                          price: targetPriceId,
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

            if (req.url?.startsWith('/api/fetch-online-cifra') && req.method === 'POST') {
              let bodyStr = '';
              req.on('data', chunk => { bodyStr += chunk; });
              req.on('end', async () => {
                try {
                  const body = JSON.parse(bodyStr || '{}');
                  const handler = (await import('./api/fetch-online-cifra.ts')).default;
                  const mockRes = {
                    setHeader: (k: string, v: string) => res.setHeader(k, v),
                    status: (code: number) => {
                      res.statusCode = code;
                      return {
                        json: (data: any) => {
                          res.setHeader('Content-Type', 'application/json');
                          res.end(JSON.stringify(data));
                        },
                        end: () => res.end()
                      };
                    }
                  };
                  await handler({ body, query: {}, method: 'POST' }, mockRes);
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Erro ao buscar cifra' }));
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
