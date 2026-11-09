export const initialApps = [
  {
    id: 'app_1',
    name: 'FlashClean Optimizer',
    category: 'Phone Cleaner & Booster',
    icon: '⚡',
    trustScore: 32,
    status: 'Dangerous',
    installDate: '2 weeks ago',
    permissions: [
      { name: 'Contacts', status: 'allowed', risk: 'HIGH', purpose: 'Reads names & phone numbers' },
      { name: 'Location', status: 'allowed', risk: 'HIGH', purpose: 'Tracks where you go' },
      { name: 'Photos & Files', status: 'allowed', risk: 'MEDIUM', purpose: 'Scans personal storage' },
      { name: 'Camera', status: 'allowed', risk: 'HIGH', purpose: 'Can take background photos' }
    ],
    timeline: [
      { time: '12:15 PM', event: 'Copied 42 contact phone numbers in background', severity: 'HIGH' },
      { time: '12:02 PM', event: 'Sent hidden data packets to an unknown server', severity: 'HIGH' },
      { time: '11:30 AM', event: 'Kept GPS location on for 45 minutes straight', severity: 'MEDIUM' }
    ],
    plainExplanation: 'A phone cleaning app should only clean junk files. This app is secretly reading your private contacts, camera, and GPS location in the background when you are not using it.'
  },
  {
    id: 'app_2',
    name: 'InstaVibe Social',
    category: 'Social Network',
    icon: '📸',
    trustScore: 48,
    status: 'Needs Review',
    installDate: '3 months ago',
    permissions: [
      { name: 'Camera', status: 'allowed', risk: 'LOW', purpose: 'Used for taking stories & photos' },
      { name: 'Photos & Files', status: 'allowed', risk: 'LOW', purpose: 'To upload media' },
      { name: 'Microphone', status: 'allowed', risk: 'MEDIUM', purpose: 'Audio recording' },
      { name: 'Contacts', status: 'allowed', risk: 'HIGH', purpose: 'Finding friends' }
    ],
    timeline: [
      { time: '11:45 AM', event: 'Scanned your entire contact book', severity: 'HIGH' },
      { time: '10:20 AM', event: 'Turned on microphone while app was minimized', severity: 'MEDIUM' }
    ],
    plainExplanation: 'This app is checking your microphone and address book even when closed. Consider turning off Contacts access to protect your friends’ privacy.'
  },
  {
    id: 'app_3',
    name: 'FitPulse Tracker',
    category: 'Fitness & Health',
    icon: '🏃',
    trustScore: 68,
    status: 'Caution',
    installDate: '1 month ago',
    permissions: [
      { name: 'Location', status: 'allowed', risk: 'LOW', purpose: 'Tracking running routes' },
      { name: 'Physical Activity', status: 'allowed', risk: 'LOW', purpose: 'Counting daily steps' },
      { name: 'Contacts', status: 'allowed', risk: 'HIGH', purpose: 'Inviting friends' }
    ],
    timeline: [
      { time: '10:15 AM', event: 'Requested GPS 30 times in 1 minute', severity: 'MEDIUM' },
      { time: '08:00 AM', event: 'Synced step count normally', severity: 'LOW' }
    ],
    plainExplanation: 'The app works fine for step counting, but checking your location 30 times a minute drains your battery and tracks your movements too closely.'
  },
  {
    id: 'app_4',
    name: 'ShopSmart Global',
    category: 'Online Shopping',
    icon: '🛍️',
    trustScore: 72,
    status: 'Caution',
    installDate: '5 months ago',
    permissions: [
      { name: 'Location', status: 'allowed', risk: 'MEDIUM', purpose: 'For local store delivery' },
      { name: 'Photos & Files', status: 'allowed', risk: 'LOW', purpose: 'To upload review photos' },
      { name: 'Contacts', status: 'restricted', risk: 'HIGH', purpose: 'Promotional sharing' }
    ],
    timeline: [
      { time: '09:30 AM', event: 'Checked city location for local sales', severity: 'LOW' },
      { time: 'Yesterday', event: 'Tried to read contacts (Blocked by E.D.I.T.H.)', severity: 'MEDIUM' }
    ],
    plainExplanation: 'This shopping app occasionally tries to read your contacts list to send promotional invites. It is recommended to keep Contacts blocked.'
  },
  {
    id: 'app_5',
    name: 'DailyNews Reader',
    category: 'News & Magazines',
    icon: '📰',
    trustScore: 74,
    status: 'Caution',
    installDate: '6 months ago',
    permissions: [
      { name: 'Photos & Files', status: 'allowed', risk: 'LOW', purpose: 'Saves offline articles' },
      { name: 'Location', status: 'allowed', risk: 'HIGH', purpose: 'Shows local city news' }
    ],
    timeline: [
      { time: '07:15 AM', event: 'Downloaded morning news edition', severity: 'LOW' },
      { time: '04:00 AM', event: 'Woke up at night to check current location', severity: 'MEDIUM' }
    ],
    plainExplanation: 'The news reader wakes up in the middle of the night to check your location for targeted ads.'
  },
  {
    id: 'app_6',
    name: 'SecureBank Mobile',
    category: 'Banking & Finance',
    icon: '🏦',
    trustScore: 96,
    status: 'Safe',
    installDate: '1 year ago',
    permissions: [
      { name: 'SMS', status: 'allowed', risk: 'LOW', purpose: 'Reads bank OTP automatically' },
      { name: 'Camera', status: 'allowed', risk: 'LOW', purpose: 'Scans QR codes for payment' }
    ],
    timeline: [
      { time: '11:00 AM', event: 'Read single SMS for login OTP verification', severity: 'LOW' },
      { time: 'Yesterday', event: 'Scanned UPI QR code safely', severity: 'LOW' }
    ],
    plainExplanation: 'Very safe. Permissions are only accessed when you are actively transferring money or logging in.'
  },
  {
    id: 'app_7',
    name: 'QuickNotes Pro',
    category: 'Productivity & Notes',
    icon: '📝',
    trustScore: 98,
    status: 'Safe',
    installDate: '8 months ago',
    permissions: [
      { name: 'Photos & Files', status: 'allowed', risk: 'LOW', purpose: 'Saves notes on device' }
    ],
    timeline: [
      { time: '09:00 AM', event: 'Saved note to device memory', severity: 'LOW' }
    ],
    plainExplanation: 'Completely private. This app never connects to the internet and stores all your data directly on your phone.'
  },
  {
    id: 'app_8',
    name: 'PodStream Music',
    category: 'Music & Audio',
    icon: '🎧',
    trustScore: 91,
    status: 'Safe',
    installDate: '4 months ago',
    permissions: [
      { name: 'Photos & Files', status: 'allowed', risk: 'LOW', purpose: 'Caches downloaded songs' }
    ],
    timeline: [
      { time: '10:00 AM', event: 'Streamed music playlist', severity: 'LOW' }
    ],
    plainExplanation: 'Behaves normally. Only uses storage to download and play your selected songs.'
  },
  {
    id: 'app_9',
    name: 'SkyWatch Weather',
    category: 'Weather Forecast',
    icon: '⛅',
    trustScore: 88,
    status: 'Safe',
    installDate: '9 months ago',
    permissions: [
      { name: 'Location', status: 'allowed', risk: 'LOW', purpose: 'Checks weather at current city' }
    ],
    timeline: [
      { time: '08:30 AM', event: 'Updated weather widget once', severity: 'LOW' }
    ],
    plainExplanation: 'Only checks your location when you open the weather report or once in the morning for widget updates.'
  },
  {
    id: 'app_10',
    name: 'Simple Calculator',
    category: 'Tools',
    icon: '🧮',
    trustScore: 100,
    status: 'Safe',
    installDate: '1 year ago',
    permissions: [],
    timeline: [
      { time: 'Yesterday', event: 'Normal arithmetic calculation', severity: 'LOW' }
    ],
    plainExplanation: 'Zero permissions needed. This tool cannot see your data or track your phone.'
  }
];