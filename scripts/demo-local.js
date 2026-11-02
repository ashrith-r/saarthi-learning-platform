import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const db=await MongoMemoryServer.create();
process.env.MONGO_URL=db.getUri();process.env.JWT_SECRET=randomBytes(32).toString('hex');process.env.SESSION_SECRET=randomBytes(32).toString('hex');process.env.NODE_ENV='development';
const {seedDemo}=await import('./demo-data.js');await mongoose.connect(process.env.MONGO_URL);
if(process.env.DEMO_RESTORE_FILE){
 const collections=mongoose.mongo.BSON.EJSON.parse(await readFile(process.env.DEMO_RESTORE_FILE,'utf8'));
 for(const [name,documents] of Object.entries(collections))if(documents.length)await mongoose.connection.db.collection(name).insertMany(documents);
}else await seedDemo();
const {startExpiryWorker}=await import('../services/expiredTests.js');startExpiryWorker();
const {default:app}=await import('../app.js');await (await import('../models/testRun.js')).default.init();const server=app.listen(process.env.PORT||3000,()=>console.log('Temporary demo ready: http://localhost:'+(process.env.PORT||3000)+' — credentials in DEMO.md'));
async function stop(){server.close();await mongoose.disconnect();await db.stop();process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
