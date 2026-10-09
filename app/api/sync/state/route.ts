import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  listApplications,
  listFavorites,
  listLetters,
  listAdaptedCVs,
} from '@/lib/auth/sync';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Faça login.' }, { status: 401 });
  }
  const userId = session.user.id;
  try {
    const [applications, favorites, letters, adapted] = await Promise.all([
      listApplications(userId),
      listFavorites(userId),
      listLetters(userId),
      listAdaptedCVs(userId),
    ]);
    return NextResponse.json({ applications, favorites, letters, adapted });
  } catch (err) {
    console.error('[api/sync/state]', err);
    return NextResponse.json({ error: 'Falha ao carregar estado.' }, { status: 500 });
  }
}
