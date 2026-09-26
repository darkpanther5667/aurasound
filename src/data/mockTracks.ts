import { Track, SocialFriend } from '../types';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Kesariya (Audio)',
    artist: 'Arijit Singh, Pritam & Amitabh Bhattacharya',
    album: 'Brahmāstra',
    duration: 268,
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    genre: 'Bollywood',
    bpm: 98,
    musicalKey: 'C# MAJ',
    audioFormat: 'LOSSLESS · 24-BIT / 96KHZ',
    colorAccent: '#F59E0B'
  },
  {
    id: 'track-2',
    title: 'Hass Hass',
    artist: 'Diljit Dosanjh & Sia',
    album: 'Hass Hass - Single',
    duration: 154,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    genre: 'Punjabi Pop',
    bpm: 104,
    musicalKey: 'Bb MIN',
    audioFormat: 'MASTER · 24-BIT / 192KHZ',
    colorAccent: '#EC4899'
  },
  {
    id: 'track-3',
    title: 'Hukum (Thalaivar Alappara)',
    artist: 'Anirudh Ravichander',
    album: 'Jailer (Original Soundtrack)',
    duration: 207,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    genre: 'South Cinema',
    bpm: 128,
    musicalKey: 'D MIN',
    audioFormat: 'LOSSLESS · 24-BIT / 96KHZ',
    colorAccent: '#EF4444'
  },
  {
    id: 'track-4',
    title: '11K',
    artist: 'Seedhe Maut & Sez On The Beat',
    album: 'Lunch Break',
    duration: 182,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    genre: 'Desi Hip-Hop',
    bpm: 140,
    musicalKey: 'F# MIN',
    audioFormat: 'LOSSLESS · 24-BIT / 48KHZ',
    colorAccent: '#8B5CF6'
  },
  {
    id: 'track-5',
    title: 'Kun Faya Kun',
    artist: 'A.R. Rahman, Mohit Chauhan & Javed Ali',
    album: 'Rockstar',
    duration: 473,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    genre: 'Sufi & Ghazal',
    bpm: 82,
    musicalKey: 'G MAJ',
    audioFormat: 'LOSSLESS · 24-BIT / 96KHZ',
    colorAccent: '#10B981'
  },
  {
    id: 'track-6',
    title: 'Softly',
    artist: 'Karan Aujla & Ikky',
    album: 'Making Memories',
    duration: 156,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    genre: 'Punjabi Pop',
    bpm: 96,
    musicalKey: 'E MIN',
    audioFormat: 'MASTER · 24-BIT / 192KHZ',
    colorAccent: '#6366F1'
  },
  {
    id: 'track-7',
    title: 'Kasoor (Acoustic)',
    artist: 'Prateek Kuhad',
    album: 'Shehron Ke Raaz',
    duration: 197,
    coverUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    genre: 'Desi Indie',
    bpm: 112,
    musicalKey: 'A MAJ',
    audioFormat: 'LOSSLESS · 24-BIT / 96KHZ',
    colorAccent: '#06B6D4'
  },
  {
    id: 'track-8',
    title: 'Mirchi',
    artist: 'DIVINE, MC Altaf, Phenom & Stylocks',
    album: 'Punya Paap',
    duration: 214,
    coverUrl: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    genre: 'Desi Hip-Hop',
    bpm: 100,
    musicalKey: 'C MIN',
    audioFormat: 'LOSSLESS · 24-BIT / 96KHZ',
    colorAccent: '#F97316'
  },
  {
    id: 'track-9',
    title: 'Raag Desh (Sitar & Tabla Odyssey)',
    artist: 'Niladri Kumar & Ustad Zakir Hussain',
    album: 'Rhythm & Soul',
    duration: 340,
    coverUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    genre: 'Classical Fusion',
    bpm: 90,
    musicalKey: 'D MAJ',
    audioFormat: 'MASTER · 24-BIT / 192KHZ',
    colorAccent: '#D97706'
  },
  {
    id: 'track-10',
    title: 'Aasa Kooda',
    artist: 'Sai Abhyankkar & Sai Smriti',
    album: 'Think Indie Originals',
    duration: 224,
    coverUrl: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?auto=format&fit=crop&w=600&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    genre: 'South Cinema',
    bpm: 118,
    musicalKey: 'G# MIN',
    audioFormat: 'LOSSLESS · 24-BIT / 96KHZ',
    colorAccent: '#3B82F6'
  }
];

export const SOCIAL_FRIENDS: SocialFriend[] = [
  {
    id: 'friend-1',
    name: 'Aarav Sharma',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80',
    currentTrack: 'Kesariya',
    artist: 'Arijit Singh',
    isLive: true,
    syncedTime: '02:14 · Synced',
    city: 'Mumbai'
  },
  {
    id: 'friend-2',
    name: 'Ananya Iyer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    currentTrack: 'Hukum',
    artist: 'Anirudh Ravichander',
    isLive: true,
    syncedTime: 'Live Session',
    city: 'Bengaluru'
  },
  {
    id: 'friend-3',
    name: 'Kabir Batra',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    currentTrack: '11K',
    artist: 'Seedhe Maut',
    isLive: false,
    syncedTime: '8m ago',
    city: 'New Delhi'
  },
  {
    id: 'friend-4',
    name: 'Diya Sen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
    currentTrack: 'Kun Faya Kun',
    artist: 'A.R. Rahman',
    isLive: true,
    syncedTime: '03:45 · Synced',
    city: 'Kolkata'
  },
  {
    id: 'friend-5',
    name: 'Rohan Reddy',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    currentTrack: 'Softly',
    artist: 'Karan Aujla',
    isLive: true,
    syncedTime: '01:05 · Synced',
    city: 'Hyderabad'
  }
];

export const GENRES = [
  'ALL VIBES',
  'Bollywood',
  'Punjabi Pop',
  'Desi Hip-Hop',
  'South Cinema',
  'Sufi & Ghazal',
  'Desi Indie',
  'Classical Fusion'
];
