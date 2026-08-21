import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUsers, addUser } from '@/lib/storage';

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('admin_auth')?.value === '1';
}


// GET /api/admin/users – List all registered users
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await getUsers();
  return NextResponse.json({ users: Object.values(users) });
}

// POST /api/admin/users – Register a new user (name + email)
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  const body = await req.json();
  const { name, email } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = await getUsers();

  if (users[normalizedEmail]) {
    return NextResponse.json(
      { error: 'A user with this email is already registered.' },
      { status: 409 }
    );
  }

  await addUser({ name: name.trim(), email: normalizedEmail });
  return NextResponse.json({
    success: true,
    user: { name: name.trim(), email: normalizedEmail },
  });
}

// DELETE /api/admin/users – Delete a user by email
export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const { deleteUser } = await import('@/lib/storage');
  await deleteUser(email.toLowerCase().trim());
  return NextResponse.json({ success: true });
}

// PATCH /api/admin/users – Update a user's name
export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { email, newName } = body;

  if (!email || !newName || newName.trim().length === 0) {
    return NextResponse.json({ error: 'Email and valid newName are required.' }, { status: 400 });
  }

  const { updateUser } = await import('@/lib/storage');
  await updateUser(email.toLowerCase().trim(), newName.trim());
  return NextResponse.json({ success: true });
}

