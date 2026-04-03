const fs = require("fs");
const path = require("path");

exports.generatePDF = (job) => {
  const filePath = path.join(
    __dirname,
    `../storage/${job.jobId}/report.txt`
  );

  const content = `
    Job ID: ${job.jobId}
    Customer: ${job.customerName}
    Status: ${job.status}
  `;

  fs.writeFileSync(filePath, content);

  console.log("PDF Generated (mock)");
};