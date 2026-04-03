const flow = {
  DESIGN: "QC",
  QC: "PRODUCTION",
  PRODUCTION: "ACCOUNT",
  ACCOUNT: "DISPATCH",
};

const roleAccess = {
  DESIGN: ["ADMIN", "DESIGNER"],
  QC: ["QC"],
  PRODUCTION: ["PRODUCTION"],
  ACCOUNT: ["ACCOUNT"],
  DISPATCH: ["DISPATCH"],
};

module.exports = { flow, roleAccess };