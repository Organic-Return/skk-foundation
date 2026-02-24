import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLeadsForAgent, getAllLeads, updateLeadStatus } from '@/lib/leads';

/**
 * Verify the request has a valid Supabase auth session and return the agent profile.
 */
async function getAuthenticatedAgent(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  const supabase = createClient(url, serviceKey);

  // Verify the JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // Get agent profile
  const { data: profile } = await supabase
    .from('agent_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function GET(request: NextRequest) {
  const profile = await getAuthenticatedAgent(request);
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get('page') || '1', 10);
  const status = sp.get('status') || undefined;
  const leadType = sp.get('leadType') || undefined;

  const filters = { page, pageSize: 25, status, leadType };

  const result = profile.role === 'admin'
    ? await getAllLeads(filters)
    : await getLeadsForAgent(profile.email, filters);

  return NextResponse.json({
    ...result,
    role: profile.role,
    agentName: profile.name,
  });
}

export async function PATCH(request: NextRequest) {
  const profile = await getAuthenticatedAgent(request);
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { leadId, status, notes } = body;

  if (!leadId || !status) {
    return NextResponse.json({ error: 'leadId and status are required' }, { status: 400 });
  }

  const success = await updateLeadStatus(leadId, status, notes);

  if (!success) {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
