import type { NextApiHandler } from 'next';
import { LOGIN_ACCOUNT_API } from '@/utils/constants';
import { parseUpstreamResponse } from '@/utils/api/proxy';

const isConfiguredUrl = (url: string) => /^https?:\/\//i.test(url);

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { email, password } = req.body as { email?: unknown; password?: unknown };
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  if (!isConfiguredUrl(LOGIN_ACCOUNT_API)) {
    res.status(503).json({ error: 'LOGIN_ACCOUNT_API is not configured' });
    return;
  }

  try {
    const upstream = await fetch(LOGIN_ACCOUNT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await parseUpstreamResponse(upstream);

    if (upstream.ok) {
      res.status(200).json(body);
      return;
    }

    if (upstream.status === 401) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    res.status(upstream.status).json({ error: 'Upstream login failed', details: body });
  } catch (error) {
    res.status(503).json({ error: 'No upstream response', details: error instanceof Error ? error.message : String(error) });
  }
};

export default handler;
