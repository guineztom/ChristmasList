import type {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'ChristmasList',
    short_name: 'XmasList',
    description:
      'Organisez vos cadeaux de Noël par personne, suivez vos budgets et partagez votre liste par lien.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FFF5F9',
    theme_color: '#EC4899',
    orientation: 'portrait',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
