import Link from 'next/link';
import {Gift} from 'lucide-react';
import {getShareById} from '@/lib/share-store.server';
import {getFirestoreShare} from '@/lib/firestore-wishlist';
import {SharedGuestView} from '@/components/shared-guest-view';

export const dynamic = 'force-dynamic';

export default async function SharePage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
  const {id} = await params;

  let share = null;
  let source: 'firestore' | 'local' = 'firestore';

  try {
    share = await getFirestoreShare(id);
  } catch {
    share = null;
  }

  if (!share) {
    share = await getShareById(id);
    source = 'local';
  }

  if (!share) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5F9] via-[#FDFBFF] to-[#F3EFFE] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/95 border border-pink-100 rounded-[28px] p-8 text-center space-y-4 shadow-[0_8px_30px_rgba(219,39,119,0.08)]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#A855F7] text-white flex items-center justify-center mx-auto">
            <Gift className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900">
            Lien introuvable
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Cette liste n&apos;existe plus ou le lien est incomplet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#EC4899] to-[#A855F7] rounded-2xl hover:opacity-95 transition-opacity"
          >
            Aller à ChristmasList
          </Link>
        </div>
      </div>
    );
  }

  return <SharedGuestView initialShare={share} source={source} />;
}
