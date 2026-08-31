import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AuditTrailModule", (m) => {
  const auditTrail = m.contract("AuditTrail");

  return { auditTrail };
});
