const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const JobSchema = new mongoose.Schema({
  status: String
}, { strict: false });

const Job = mongoose.model('Job', JobSchema);

async function checkHoldJobs() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adminpulse');
    const holdCount = await Job.countDocuments({ status: 'HOLD' });
    console.log(`Found ${holdCount} jobs with status 'HOLD'`);
    
    if (holdCount > 0) {
      console.log('Updating HOLD jobs to DRAFT...');
      const result = await Job.updateMany({ status: 'HOLD' }, { status: 'DRAFT' });
      console.log(`Updated ${result.modifiedCount} jobs.`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkHoldJobs();
