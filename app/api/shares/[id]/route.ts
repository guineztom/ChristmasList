import {NextRequest, NextResponse} from 'next/server';
import {
  getShareById,
  toggleSharedGiftPurchased,
} from '@/lib/share-store.server';

export async function GET(
  _req: NextRequest,
  context: {params: Promise<{id: string}>}
) {
  const {id} = await context.params;
  const share = await getShareById(id);
  if (!share) {
    return NextResponse.json(
      {error: 'Liste partagée introuvable.'},
      {status: 404}
    );
  }
  return NextResponse.json({share});
}

export async function PATCH(
  req: NextRequest,
  context: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await context.params;
    const body = (await req.json()) as {
      giftId?: unknown;
      purchased?: unknown;
    };

    if (
      typeof body.giftId !== 'string' ||
      typeof body.purchased !== 'boolean'
    ) {
      return NextResponse.json(
        {
          error:
            'Action refusée : seul le statut acheté/à acheter peut être modifié.',
        },
        {status: 400}
      );
    }

    const updated = await toggleSharedGiftPurchased(
      id,
      body.giftId,
      body.purchased
    );
    if (!updated) {
      return NextResponse.json(
        {error: 'Liste ou cadeau introuvable.'},
        {status: 404}
      );
    }

    return NextResponse.json({share: updated});
  } catch {
    return NextResponse.json(
      {error: 'Erreur lors de la mise à jour du statut.'},
      {status: 500}
    );
  }
}
