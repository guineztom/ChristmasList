import {NextRequest, NextResponse} from 'next/server';
import {upsertShare} from '@/lib/share-store.server';
import {GiftItem, Person} from '@/lib/wishlist-types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      shareId?: string;
      title?: string;
      ownerLabel?: string;
      scope?: 'all' | 'person';
      personId?: string;
      people?: Person[];
      gifts?: GiftItem[];
    };

    if (!Array.isArray(body.people) || !Array.isArray(body.gifts)) {
      return NextResponse.json(
        {error: 'Données de wishlist invalides.'},
        {status: 400}
      );
    }

    if (body.people.length === 0) {
      return NextResponse.json(
        {error: 'Ajoutez au moins une personne avant de partager.'},
        {status: 400}
      );
    }

    const share = await upsertShare({
      shareId: typeof body.shareId === 'string' ? body.shareId : undefined,
      title:
        typeof body.title === 'string' && body.title.trim()
          ? body.title
          : 'Wishlist de Noël',
      ownerLabel:
        typeof body.ownerLabel === 'string' ? body.ownerLabel : undefined,
      scope: body.scope === 'person' ? 'person' : 'all',
      personId: typeof body.personId === 'string' ? body.personId : undefined,
      people: body.people,
      gifts: body.gifts,
    });

    return NextResponse.json({share});
  } catch {
    return NextResponse.json(
      {error: 'Impossible de créer le lien de partage.'},
      {status: 500}
    );
  }
}
