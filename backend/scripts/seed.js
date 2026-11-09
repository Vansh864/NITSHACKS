import { seedDatabase } from '../db/repository.js';
import { initialApps } from '../db/schema.js';

seedDatabase(initialApps);
console.log('Seeded E.D.I.T.H. database with the default demo apps.');
