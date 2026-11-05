import {startExpiryWorker} from "./services/expiredTests.js";
import app from "./app.js";
import connectDB from "./config/database.js";

const PORT = process.env.PORT || 3000;

connectDB()
  .then(async () => {
    const {default:Run}=await import('./models/testRun.js');
    await Run.init();
    const {default:User}=await import('./models/user.js');
    const {MobileOtp,MobileOtpBudget}=await import('./models/mobileOtp.js');
    await Promise.all([User.init(),MobileOtp.init(),MobileOtpBudget.init()]);
    startExpiryWorker();
    app.listen(PORT, () => console.log(`Saarthi running at http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
