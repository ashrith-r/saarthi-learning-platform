import Run from '../models/testRun.js';
import {finalize} from '../controllers/practiceController.js';
export async function finalizeExpiredTests(){
  const runs=await Run.find({status:'active',expiresAt:{$lte:new Date()}}).limit(100);
  for(const run of runs)await finalize(run);
}
export function startExpiryWorker(){
  const timer=setInterval(()=>finalizeExpiredTests().catch(error=>console.error('Assessment expiry worker failed:',error.message)),30000);
  timer.unref();
  return timer;
}
