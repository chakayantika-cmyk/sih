import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLogs } from '@/lib/storage';

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === '1';
}


// GET /api/admin/logs – Fetch all login activity logs (newest first)
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  const logs = await getLogs();
  return NextResponse.json({ logs });
}
