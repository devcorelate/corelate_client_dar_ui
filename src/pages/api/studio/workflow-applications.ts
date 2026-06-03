import type { NextApiHandler } from 'next';
import { STUDIO_WORKFLOW_APPLICATIONS_API } from '@/utils/constants';
import { allowCors } from '@/utils/headers/cross-origin-header';
import { appendQueryParams, bearerHeaders, parseUpstreamResponse } from '@/utils/api/proxy';

const isConfiguredUrl = (url: string) => /^https?:\/\//i.test(url);

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isConfiguredUrl(STUDIO_WORKFLOW_APPLICATIONS_API)) {
    res.status(503).json({ error: 'STUDIO_WORKFLOW_APPLICATIONS_API is not configured' });
    return;
  }

  try {
    const upstream = await fetch(appendQueryParams(STUDIO_WORKFLOW_APPLICATIONS_API, req.query), {
      method: 'GET',
      headers: bearerHeaders(req),
    });
    const parsedBody = await parseUpstreamResponse(upstream);
    res.status(upstream.status).json({
      message: 'Studio workflow applications fetched successfully',
      apiData: parsedBody,
    });
  } catch (error) {
    res.status(503).json({ error: 'No upstream response', details: error instanceof Error ? error.message : String(error) });
  }
};

export default allowCors(handler);
