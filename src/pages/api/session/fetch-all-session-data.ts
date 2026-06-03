import type { NextApiHandler } from 'next';
import { SESSION_DATA_FETCH_ALL_URL } from '@/utils/constants';
import { allowCors } from '@/utils/headers/cross-origin-header';
import { bearerHeaders, parseUpstreamResponse } from '@/utils/api/proxy';

const isConfiguredUrl = (url: string) => /^https?:\/\//i.test(url);

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isConfiguredUrl(SESSION_DATA_FETCH_ALL_URL)) {
    res.status(503).json({ error: 'SESSION_DATA_FETCH_ALL_URL is not configured' });
    return;
  }

  try {
    const upstream = await fetch(SESSION_DATA_FETCH_ALL_URL, {
      method: 'GET',
      headers: bearerHeaders(req),
    });
    const parsedBody = await parseUpstreamResponse(upstream);
    res.status(upstream.status).json({
      message: 'Session data fetched successfully',
      apiData: parsedBody,
    });
  } catch (error) {
    res.status(503).json({ error: 'No upstream response', details: error instanceof Error ? error.message : String(error) });
  }
};

export default allowCors(handler);
