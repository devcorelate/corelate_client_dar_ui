import type { NextApiHandler } from 'next';
import { WORKFLOW_FETCH_BY_ID_API } from '@/utils/constants';
import { allowCors } from '@/utils/headers/cross-origin-header';
import { bearerHeaders, parseUpstreamResponse } from '@/utils/api/proxy';

const isConfiguredUrl = (url: string) => /^https?:\/\//i.test(url);

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET,POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body as { id?: unknown } | undefined;
  const queryId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const id = req.method === 'GET' ? queryId : body?.id;
  if (typeof id !== 'string' || !id.trim()) {
    res.status(400).json({ error: 'Workflow id is required' });
    return;
  }

  if (!isConfiguredUrl(WORKFLOW_FETCH_BY_ID_API)) {
    res.status(503).json({ error: 'WORKFLOW_FETCH_BY_ID_API is not configured' });
    return;
  }

  try {
    const upstream = await fetch(`${WORKFLOW_FETCH_BY_ID_API}${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: bearerHeaders(req),
    });
    const parsedBody = await parseUpstreamResponse(upstream);
    res.status(upstream.status).json({
      message: 'Workflow fetched successfully',
      storageKey: 'saved_workflows',
      apiData: parsedBody,
    });
  } catch (error) {
    res.status(503).json({ error: 'No upstream response', details: error instanceof Error ? error.message : String(error) });
  }
};

export default allowCors(handler);
