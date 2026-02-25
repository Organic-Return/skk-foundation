import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAgent } from '@/lib/dashboard-auth';
import { getLeadsForAgent, getAllLeads, updateLeadStatus } from '@/lib/leads';

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
