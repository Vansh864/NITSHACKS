export const initialApps = [
  {
    id: 'app_1',
    name: 'FlashClean Optimizer',
    category: 'Phone Cleaner & Booster',
    icon: '⚡',
    trustScore: 32,
    status: 'Dangerous',
    installDate: '2 weeks ago',
    installedAt: '2026-10-05T14:00:00.000Z',
    permissions: [
      { name: 'Contacts', status: 'allowed', risk: 'HIGH', purpose: 'Reads names & phone numbers' },
      { name: 'Location', status: 'allowed', risk: 'HIGH', purpose: 'Tracks where you go' },
      { name: 'Photos & Files', status: 'allowed', risk: 'MEDIUM', purpose: 'Scans personal storage' },
      { name: 'Camera', status: 'allowed', risk: 'HIGH', purpose: 'Can take background photos' },
    ],
    plainExplanation:
      'A phone cleaning app should only clean junk files. This app is secretly reading your private contacts, camera, and GPS location in the background when you are not using it.',
  },
  {
    id: 'app_2',
    name: 'InstaVibe Social',
    category: 'Social Network',
    icon: '📸',
    trustScore: 48,
    status: 'Needs Review',
    installDate: '3 months ago',
    installedAt: '2026-08-05T12:00:00.000Z',
    permissions: [
      { name: 'Camera', status: 'allowed', risk: 'LOW', purpose: 'Used for taking stories & photos' },
      { name: 'Photos & Files', status: 'allowed', risk: 'LOW', purpose: 'To upload media' },
      { name: 'Microphone', status: 'allowed', risk: 'MEDIUM', purpose: 'Audio recording' },
      { name: 'Contacts', status: 'allowed', risk: 'HIGH', purpose: 'Finding friends' },
    ],
    plainExplanation:
      'This app is checking your microphone and address book even when closed. Consider turning off Contacts access to protect your friends’ privacy.',
  },
  {
    id: 'app_3',
    name: 'FitPulse Tracker',
    category: 'Fitness & Health',
    icon: '🏃',
    trustScore: 68,
    status: 'Caution',
    installDate: '1 month ago',
    installedAt: '2026-10-09T09:00:00.000Z',
    permissions: [
      { name: 'Location', status: 'allowed', risk: 'LOW', purpose: 'Tracking running routes' },
      { name: 'Physical Activity', status: 'allowed', risk: 'LOW', purpose: 'Counting daily steps' },
      { name: 'Contacts', status: 'allowed', risk: 'HIGH', purpose: 'Inviting friends' },
    ],
    plainExplanation:
      'The app works fine for step counting, but checking your location 30 times a minute drains your battery and tracks your movements too closely.',
  },
  {
    id: 'app_4',
    name: 'ShopSmart Global',
    category: 'Online Shopping',
    icon: '🛍️',
    trustScore: 72,
    status: 'Caution',
    installDate: '5 months ago',
    installedAt: '2026-06-22T13:00:00.000Z',
    permissions: [
      { name: 'Location', status: 'allowed', risk: 'MEDIUM', purpose: 'For local store delivery' },
      { name: 'Photos & Files', status: 'allowed', risk: 'LOW', purpose: 'To upload review photos' },
      { name: 'Contacts', status: 'restricted', risk: 'HIGH', purpose: 'Promotional sharing' },
    ],
    plainExplanation:
      'This shopping app occasionally tries to read your contacts list to send promotional invites. It is recommended to keep Contacts blocked.',
  },
  {
    id: 'app_5',
    name: 'DailyNews Reader',
    category: 'News & Magazines',
    icon: '📰',
    trustScore: 74,
    status: 'Caution',
    installDate: '6 months ago',
    installedAt: '2026-05-25T18:00:00.000Z',
    permissions: [
      { name: 'Photos & Files', status: 'allowed', risk: 'LOW', purpose: 'Saves offline articles' },
      { name: 'Location', status: 'allowed', risk: 'HIGH', purpose: 'Shows local city news' },
    ],
    plainExplanation:
      'The news reader wakes up in the middle of the night to check your location for targeted ads.',
  },
  {
    id: 'app_6',
    name: 'SecureBank Mobile',
    category: 'Banking & Finance',
    icon: '🏦',
    trustScore: 96,
    status: 'Safe',
    installDate: '1 year ago',
    installedAt: '2025-11-18T10:00:00.000Z',
    permissions: [
      { name: 'SMS', status: 'allowed', risk: 'LOW', purpose: 'Reads bank OTP automatically' },
      { name: 'Camera', status: 'allowed', risk: 'LOW', purpose: 'Scans QR codes for payment' },
    ],
    plainExplanation:
      'Very safe. Permissions are only accessed when you are actively transferring money or logging in.',
  },
  {
    id: 'app_7',
    name: 'QuickNotes Pro',
    category: 'Productivity & Notes',
    icon: '📝',
    trustScore: 98,
    status: 'Safe',
    installDate: '8 months ago',
    installedAt: '2026-03-14T07:00:00.000Z',
    permissions: [
      { name: 'Photos & Files', status: 'allowed', risk: 'LOW', purpose: 'Saves notes on device' },
    ],
    plainExplanation:
      'Completely private. This app never connects to the internet and stores all your data directly on your phone.',
  },
];

export const categoryExpectations = {
  'Phone Cleaner & Booster': ['Photos & Files', 'Camera', 'Storage'],
  'Social Network': ['Camera', 'Photos & Files', 'Microphone'],
  'Fitness & Health': ['Location', 'Physical Activity'],
  'Online Shopping': ['Location', 'Photos & Files'],
  'News & Magazines': ['Location', 'Photos & Files'],
  'Banking & Finance': ['SMS', 'Camera'],
  'Productivity & Notes': ['Photos & Files'],
};

export const validStatuses = ['Safe', 'Caution', 'Dangerous', 'Needs Review'];
export const validAlertStatuses = ['open', 'acknowledged', 'resolved'];
export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'];
