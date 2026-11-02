import config from '../config/config.js';
import mongoose from 'mongoose';
import {seedDemo} from './demo-data.js';
if(process.env.NODE_ENV==='production'||process.env.ALLOW_DEMO_SEED!=='yes')throw new Error('Demo seeding requires a development database and ALLOW_DEMO_SEED=yes.');
await mongoose.connect(config.MONGO_URL);
try{await seedDemo();console.log('Demo fixtures ready. See DEMO.md for sign-in details.');}finally{await mongoose.disconnect();}
