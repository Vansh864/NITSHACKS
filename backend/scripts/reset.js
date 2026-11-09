import { seedDatabase } from '../db/repository.js';
import { initialApps } from '../db/schema.js';

seedDatabase(initialApps);
console.log('Reset E.D.I.T.H. database to the original demo dataset.');
