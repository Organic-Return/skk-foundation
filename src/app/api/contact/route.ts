import { NextResponse } from 'next/server';
import { createLeadFromForm, isClozeConfigured } from '@/lib/cloze';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  message?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ContactFormData;

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Split name into first/last
    const nameParts = body.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (!isClozeConfigured()) {
      console.warn('Cloze CRM is not configured. Contact form lead will not be synced.');
      return NextResponse.json({
        success: true,
        message: 'Message received (CRM not configured)',
        clozeSync: false,
      });
    }

    const result = await createLeadFromForm({
      firstName,
      lastName,
      email: body.email,
      phone: body.phone,
      message: body.message,
      propertyInterest: body.interest,
      source: 'Website Contact Form',
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      clozeSync: true,
      clozeId: result.id,
    });
  } catch (error) {
    console.error('Error processing contact form:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
