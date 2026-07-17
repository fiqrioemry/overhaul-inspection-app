import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  RoleEnum,
  StatusEnum,
  CompanyType,
  DocumentType,
  MasterDataStatus,
  AcceptanceType,
  CriteriaSeverity,
  ProcessType,
  ProcessStatusEnum,
  ChecklistStatusEnum,
  TankLocationEnum,
  TankServiceEnum,
  TankAssetStatusEnum,
  TankProjectTypeEnum,
  TankProjectStatusEnum,
  InspectionRequestTypeEnum,
} from "../generated/prisma";
import { hashPassword } from "../src/utils/hash";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "Password123@";

// ─── Batch 1: Users ──────────────────────────────────────────────────────────

const users = [
  { email: "superadmin@overhaul.com", name: "Super Administrator", role: RoleEnum.SUPER_ADMIN },
  { email: "admin@overhaul.com", name: "System Administrator", role: RoleEnum.ADMIN },
  { email: "inspector@overhaul.com", name: "Ahmad Fiqri Oemry", role: RoleEnum.INSPECTOR },
  { email: "user@overhaul.com", name: "Pertamina SSIE User", role: RoleEnum.USER },
];

// ─── Batch 1: Companies ───────────────────────────────────────────────────────

const companies = [
  {
    name: "PT Pertamina Patra Niaga",
    type: CompanyType.OWNER,
    address: "Jl. Kramat Raya No. 59, Jakarta Pusat",
    phone: "+62-21-31937000",
    email: "info@pertaminapatraniaga.com",
  },
  {
    name: "PT Biro Klasifikasi Indonesia",
    type: CompanyType.INSPECTOR_COMPANY,
    address: "Jl. Yos Sudarso No. 38-40, Jakarta Utara",
    phone: "+62-21-4301017",
    email: "info@bki.co.id",
  },
  {
    name: "PT Jasa Karya Teknik",
    type: CompanyType.CONTRACTOR,
    address: "Jl. Industri Raya No. 12, Tangerang",
    phone: "+62-21-5501234",
    email: "info@jasakarya.co.id",
  },
];

// ─── Batch 1: Company personnel (positioned users) ───────────────────────────

const companyPersonnel = [
  // PT Pertamina Patra Niaga (OWNER) — role USER
  { email: "romi.nuzulian@pertamina.com", name: "Romi Nuzulian", role: RoleEnum.USER, position: "Inspector", companyName: "PT Pertamina Patra Niaga" },
  { email: "muhammad.ari.wijaya@pertamina.com", name: "Muhammad Ari Wijaya", role: RoleEnum.USER, position: "Inspector", companyName: "PT Pertamina Patra Niaga" },
  { email: "nikita.indira.kusuma@pertamina.com", name: "Nikita Indira Kusuma", role: RoleEnum.USER, position: "Jr. Engineer I", companyName: "PT Pertamina Patra Niaga" },
  { email: "fajar@pertamina.com", name: "Fajar", role: RoleEnum.USER, position: "Lead of Statutory Eng.", companyName: "PT Pertamina Patra Niaga" },
  // PT Biro Klasifikasi Indonesia (INSPECTOR_COMPANY) — role INSPECTOR
  { email: "brian.adiguna@bki.co.id", name: "Brian Adiguna", role: RoleEnum.INSPECTOR, position: "Tank Inspector", companyName: "PT Biro Klasifikasi Indonesia" },
  { email: "ahmad.fiqri.oemry@bki.co.id", name: "Ahmad Fiqri Oemry", role: RoleEnum.INSPECTOR, position: "Welding Inspector", companyName: "PT Biro Klasifikasi Indonesia" },
  { email: "bayu.ade.wijaya@bki.co.id", name: "Bayu Ade Wijaya", role: RoleEnum.INSPECTOR, position: "Welding Inspector", companyName: "PT Biro Klasifikasi Indonesia" },
];

// ─── Batch 2: Reference Documents ────────────────────────────────────────────

const referenceDocs = [
  {
    code: "KAK-PTN-001",
    title: "Kerangka Acuan Kerja – Overhaul Tangki Pertamina Patra Niaga",
    documentType: DocumentType.SPECIFICATION,
    issuer: "PT Pertamina Patra Niaga",
    revision: "Rev.0",
    status: MasterDataStatus.ACTIVE,
  },
  {
    code: "API-650",
    title: "API Standard 650 – Welded Tanks for Oil Storage",
    documentType: DocumentType.STANDARD,
    issuer: "American Petroleum Institute",
    revision: "13th Edition",
    status: MasterDataStatus.ACTIVE,
  },
  {
    code: "ASME-IX",
    title: "ASME Section IX – Welding, Brazing, and Fusing Qualifications",
    documentType: DocumentType.STANDARD,
    issuer: "American Society of Mechanical Engineers",
    revision: "2023 Edition",
    status: MasterDataStatus.ACTIVE,
  },
  {
    code: "WPS-TK-001",
    title: "Welding Procedure Specification – Shell & Bottom Plate Welding",
    documentType: DocumentType.WPS,
    issuer: "PT Jasa Karya Teknik",
    revision: "Rev.2",
    status: MasterDataStatus.ACTIVE,
  },
  {
    code: "ITP-TK-001",
    title: "Inspection and Test Plan – Tangki Timbun Overhaul",
    documentType: DocumentType.ITP,
    issuer: "PT Biro Klasifikasi Indonesia",
    revision: "Rev.1",
    status: MasterDataStatus.ACTIVE,
  },
];

// ─── Batch 2: Acceptance Criteria ────────────────────────────────────────────

const acceptanceCriteriaData = [
  {
    code: "AC-VIS-001",
    name: "Visual weld — bebas slag dan kotoran",
    description: "Permukaan las harus bersih dari slag, kotoran, dan kontaminan lain.",
    acceptanceType: AcceptanceType.PASS_FAIL,
    isRequired: true,
    severity: CriteriaSeverity.CRITICAL,
    method: "Visual Inspection",
    status: MasterDataStatus.ACTIVE,
    refCodes: ["API-650", "KAK-PTN-001"],
  },
  {
    code: "AC-VIS-002",
    name: "Visual weld — bebas spatter berlebih",
    description: "Permukaan las tidak boleh memiliki percikan las (spatter) yang berlebihan.",
    acceptanceType: AcceptanceType.PASS_FAIL,
    isRequired: true,
    severity: CriteriaSeverity.MAJOR,
    method: "Visual Inspection",
    status: MasterDataStatus.ACTIVE,
    refCodes: ["API-650"],
  },
  {
    code: "AC-VIS-003",
    name: "Visual weld — tidak ada undercut berlebih",
    description: "Undercut pada las tidak boleh melebihi 0.8 mm atau 10% dari ketebalan pelat.",
    acceptanceType: AcceptanceType.PASS_FAIL,
    isRequired: true,
    severity: CriteriaSeverity.CRITICAL,
    method: "Visual Inspection",
    tools: "Weld gauge",
    status: MasterDataStatus.ACTIVE,
    refCodes: ["API-650", "KAK-PTN-001"],
  },
  {
    code: "AC-DIM-001",
    name: "Overlap pelat dasar minimum 50 mm",
    description: "Jarak overlap antar pelat dasar (bottom plate) tidak boleh kurang dari 50 mm.",
    acceptanceType: AcceptanceType.NUMERIC_MIN,
    minValue: 50,
    unit: "mm",
    operator: ">=",
    isRequired: true,
    severity: CriteriaSeverity.CRITICAL,
    method: "Measurement",
    tools: "Measuring tape",
    status: MasterDataStatus.ACTIVE,
    refCodes: ["API-650", "KAK-PTN-001"],
  },
  {
    code: "AC-DIM-002",
    name: "Celah annular plate minimum 8 mm",
    description: "Celah antara annular plate dan shell plate tidak boleh kurang dari 8 mm.",
    acceptanceType: AcceptanceType.NUMERIC_MIN,
    minValue: 8,
    unit: "mm",
    operator: ">=",
    isRequired: true,
    severity: CriteriaSeverity.MAJOR,
    method: "Measurement",
    tools: "Measuring tape, feeler gauge",
    status: MasterDataStatus.ACTIVE,
    refCodes: ["API-650"],
  },
  {
    code: "AC-DIM-003",
    name: "Peaking (out-of-roundness) maksimum 13 mm",
    description: "Deformasi bentuk kerucut (peaking) pada shell tidak boleh melebihi 13 mm.",
    acceptanceType: AcceptanceType.NUMERIC_MAX,
    maxValue: 13,
    unit: "mm",
    operator: "<=",
    isRequired: true,
    severity: CriteriaSeverity.MAJOR,
    method: "Measurement",
    tools: "Peaking jig, measuring tape",
    status: MasterDataStatus.ACTIVE,
    refCodes: ["API-650"],
  },
  {
    code: "AC-DIM-004",
    name: "Banding (out-of-plumb) maksimum 13 mm",
    description: "Deformasi bentuk gelombang (banding) pada shell tidak boleh melebihi 13 mm.",
    acceptanceType: AcceptanceType.NUMERIC_MAX,
    maxValue: 13,
    unit: "mm",
    operator: "<=",
    isRequired: true,
    severity: CriteriaSeverity.MAJOR,
    method: "Measurement",
    tools: "Banding jig, measuring tape",
    status: MasterDataStatus.ACTIVE,
    refCodes: ["API-650"],
  },
  {
    code: "AC-DIM-005",
    name: "Gap butt weld 1.5–3.0 mm",
    description: "Celah sambungan butt weld harus berada dalam rentang 1.5 mm hingga 3.0 mm.",
    acceptanceType: AcceptanceType.NUMERIC_RANGE,
    minValue: 1.5,
    maxValue: 3.0,
    unit: "mm",
    operator: "between",
    isRequired: true,
    severity: CriteriaSeverity.CRITICAL,
    method: "Measurement",
    tools: "Weld gauge, feeler gauge",
    status: MasterDataStatus.ACTIVE,
    refCodes: ["API-650", "WPS-TK-001"],
  },
  {
    code: "AC-TST-001",
    name: "Hasil uji kebocoran / tekanan — lulus",
    description: "Pengujian tekanan atau kebocoran harus menunjukkan hasil LULUS tanpa tanda-tanda kebocoran.",
    acceptanceType: AcceptanceType.PASS_FAIL,
    isRequired: true,
    severity: CriteriaSeverity.CRITICAL,
    method: "Pneumatic / Hydrostatic test",
    tools: "Pressure gauge, soapy water",
    status: MasterDataStatus.ACTIVE,
    refCodes: ["API-650", "ITP-TK-001"],
  },
];

// ─── Batch 2: Process Templates ───────────────────────────────────────────────

const processTemplatesData = [
  { code: "PT-001", name: "Pembersihan Tangki", type: ProcessType.WORK, sequenceOrder: 1, isOptional: false },
  { code: "PT-002", name: "Pembongkaran Tangki Existing", type: ProcessType.WORK, sequenceOrder: 2, isOptional: false },
  { code: "PT-003", name: "Pekerjaan Pondasi", type: ProcessType.WORK, sequenceOrder: 3, isOptional: false },
  { code: "PT-004", name: "Pemasangan Pelat Dasar (Bottom Plate)", type: ProcessType.WORK, sequenceOrder: 4, isOptional: false },
  { code: "PT-005", name: "Uji Kebocoran Minyak (Oil Leak Test)", type: ProcessType.TEST, sequenceOrder: 5, isOptional: false },
  { code: "PT-006", name: "Uji Pneumatik Pelat Dasar (Pneumatic Bottom Test)", type: ProcessType.TEST, sequenceOrder: 6, isOptional: false },
  { code: "PT-007", name: "Pemasangan dan Pengelasan Shell Plate", type: ProcessType.WORK, sequenceOrder: 7, isOptional: false },
  { code: "PT-008", name: "Uji Radiografi Shell (Radiography Shell Test)", type: ProcessType.NDT, sequenceOrder: 8, isOptional: false },
  { code: "PT-009", name: "Uji Pneumatik Reinforcement Pad", type: ProcessType.TEST, sequenceOrder: 9, isOptional: false },
  { code: "PT-010", name: "Hydrotest Shell", type: ProcessType.TEST, sequenceOrder: 10, isOptional: false },
  { code: "PT-011", name: "Hydrotest Steam Coil Pipe", type: ProcessType.TEST, sequenceOrder: 11, isOptional: true, applicabilityRule: "STEAM_COIL" },
  { code: "PT-012", name: "Hydrotest Inlet/Outlet Pipe", type: ProcessType.TEST, sequenceOrder: 12, isOptional: false },
  { code: "PT-013", name: "Pemasangan dan Pengelasan Roof Plate", type: ProcessType.WORK, sequenceOrder: 13, isOptional: false },
  { code: "PT-014", name: "Uji Pneumatik Roof (Pneumatic Roof Test)", type: ProcessType.TEST, sequenceOrder: 14, isOptional: false },
  { code: "PT-015", name: "Inspeksi Coating dan Finishing", type: ProcessType.COATING, sequenceOrder: 15, isOptional: false },
  { code: "PT-016", name: "Commissioning dan Serah Terima", type: ProcessType.COMMISSIONING, sequenceOrder: 16, isOptional: false },
];

// Criteria to map per process (code -> criteria codes)
const processCriteriaMappings: Record<string, string[]> = {
  "PT-004": ["AC-VIS-001", "AC-VIS-002", "AC-VIS-003", "AC-DIM-001", "AC-DIM-002", "AC-DIM-005"],
  "PT-005": ["AC-TST-001"],
  "PT-006": ["AC-TST-001"],
  "PT-007": ["AC-VIS-001", "AC-VIS-002", "AC-VIS-003", "AC-DIM-003", "AC-DIM-004", "AC-DIM-005"],
  "PT-009": ["AC-TST-001"],
  "PT-010": ["AC-TST-001"],
  "PT-011": ["AC-TST-001"],
  "PT-012": ["AC-TST-001"],
  "PT-013": ["AC-VIS-001", "AC-VIS-002", "AC-VIS-003"],
  "PT-014": ["AC-TST-001"],
};

// Process dependencies: processCode -> [requiredCode]
const processDependencies: Record<string, string[]> = {
  "PT-005": ["PT-004"],
  "PT-006": ["PT-005"],
  "PT-007": ["PT-006"],
  "PT-008": ["PT-007"],
  "PT-009": ["PT-007"],
  "PT-010": ["PT-006", "PT-008"],
  "PT-011": ["PT-010"],
  "PT-012": ["PT-010"],
  "PT-013": ["PT-010"],
  "PT-014": ["PT-013", "PT-010"],
  "PT-015": ["PT-014"],
  "PT-016": ["PT-015"],
};

// ─── Batch 5: Inspection form templates (NDE clearance print forms) ──────────
// One active template per non-NDT test type. PENETRANT_TEST / RADIOGRAPHY_TEST
// intentionally have no template — they keep the legacy A4 portrait print form.

const inspectionFormTemplatesData: Array<{
  code: string;
  testType: InspectionRequestTypeEnum;
  title: string;
  defaultStandardAndCode: string;
  acceptanceCriteriaText: string;
  checklistItems: Array<{ label: string }>;
}> = [
  {
    code: "NDE-PBT",
    testType: InspectionRequestTypeEnum.PNEUMATIC_BOTTOM_TEST,
    title: "PNEUMATIC BOTTOM TEST CLEARANCE FORM",
    defaultStandardAndCode: "API 650 Sec. 7.2.4.2 / 7.3.3 / 8.6 or approved ITP / approved NDT procedure",
    acceptanceCriteriaText:
      "Accepted apabila tidak terdapat bubble formation / indikasi leakage pada area las yang diuji dan tidak terdapat defect visual yang tidak diterima.",
    checklistItems: [
      { label: "Hasil lasan bersih dari slag, spatter, oil, grease, dan kontaminan." },
      { label: "Weld capping / weld profile sudah terpenuhi." },
      { label: "Tidak terdapat undercut yang melebihi acceptance criteria." },
      { label: "Oil leak test sudah dilaksanakan." },
      // Trailing blank row: filled in by hand on the printed form.
      { label: "" },
    ],
  },
  {
    code: "NDE-PRT",
    testType: InspectionRequestTypeEnum.PNEUMATIC_ROOF_TEST,
    title: "PNEUMATIC ROOF TEST CLEARANCE FORM",
    defaultStandardAndCode: "API 650 Sec. 7.3.8 / API 650 Sec. 8.6 or approved ITP / approved test procedure",
    acceptanceCriteriaText:
      "Accepted apabila tidak terdapat bubble formation / leakage pada seluruh weld joint yang diuji dan tidak terjadi penurunan tekanan abnormal selama test.",
    checklistItems: [
      { label: "Hasil lasan roof bersih dari slag, spatter, oil, grease, dan kontaminan." },
      { label: "Weld capping / weld profile sudah terpenuhi." },
      { label: "Tidak terdapat undercut yang melebihi acceptance criteria." },
      { label: "Hydrotest shell sudah dilaksanakan." },
      { label: "Vent / seluruh opening yang diperlukan untuk test sudah ditutup." },
      // Trailing blank row: filled in by hand on the printed form.
      { label: "" },
    ],
  },
  {
    code: "NDE-HTS",
    testType: InspectionRequestTypeEnum.HYDROTEST_SHELL,
    title: "HYDROTEST SHELL CLEARANCE FORM",
    defaultStandardAndCode: "API 650 Sec. 7.3.6 / 7.3.7 or API 653 for existing/repair/alteration tank and approved hydrotest procedure",
    acceptanceCriteriaText:
      "Accepted apabila tidak terdapat leakage, tidak terdapat deformasi abnormal, tidak terdapat settlement di luar batas yang diizinkan, dan tidak terdapat penurunan level air yang signifikan di luar acceptance project specification.",
    checklistItems: [
      { label: "Hasil lasan bersih dari slag, spatter, oil, grease, dan kontaminan." },
      { label: "Weld capping / weld profile sudah terpenuhi." },
      { label: "Tidak terdapat undercut yang melebihi acceptance criteria." },
      { label: "Hasil radiography untuk tiap shell course tidak ada repair." },
      { label: "Pneumatic Bottom test sudah terpenuhi." },
      { label: "Pneumatic reinforcement pad test sudah terpenuhi." },
      // Trailing blank row: filled in by hand on the printed form.
      { label: "" },
    ],
  },
  {
    code: "NDE-HTP",
    testType: InspectionRequestTypeEnum.HYDROTEST_PIPE,
    title: "HYDROTEST PIPE CLEARANCE FORM",
    defaultStandardAndCode: "ASME B31.3 Sec. 345 or applicable line class / project specification",
    acceptanceCriteriaText:
      "Accepted apabila tidak terdapat leakage, tidak terdapat pressure drop abnormal, tidak terdapat deformasi, dan seluruh joint / connection dalam kondisi aman setelah pressure holding.",
    checklistItems: [
      { label: "Hasil lasan bersih dari slag, spatter, oil, grease, dan kontaminan." },
      { label: "Weld capping / weld profile sudah terpenuhi." },
      { label: "Tidak terdapat undercut yang melebihi acceptance criteria." },
      { label: "Radiography Test sudah tidak ada repair." },
      { label: "Pressure gauge tersedia dan terkalibrasi." },
      { label: "Blind flange / spectacle blind / isolation sudah terpasang sesuai test boundary." },
      // Trailing blank row: filled in by hand on the printed form.
      { label: "" },
    ],
  },
  {
    code: "NDE-PRP",
    testType: InspectionRequestTypeEnum.PNEUMATIC_REINFORCEMENT_TEST,
    title: "PNEUMATIC REINFORCEMENT PAD TEST CLEARANCE FORM",
    defaultStandardAndCode: "API 650 Sec. 7.3.5",
    acceptanceCriteriaText:
      "Accepted apabila tidak terdapat bubble formation / leakage pada weld attachment reinforcement pad selama tekanan ditahan.",
    checklistItems: [
      { label: "Telltale hole / weep hole sudah tersedia dan tidak tertutup." },
      { label: "Penetrant test pada nozzle-to-shell weld / repad weld sudah dilaksanakan." },
      { label: "Tidak terdapat undercut yang melebihi acceptance criteria." },
      { label: "Weld capping / weld profile sudah terpenuhi." },
      { label: "Hasil lasan bersih dari slag, spatter, oil, grease, dan kontaminan." },
      { label: "Pressure gauge tersedia dan terkalibrasi." },
      // Trailing blank row: filled in by hand on the printed form.
      { label: "" },
    ],
  },
  {
    code: "NDE-OLT",
    testType: InspectionRequestTypeEnum.OIL_LEAK_TEST,
    title: "OIL LEAK TEST CLEARANCE FORM",
    defaultStandardAndCode: "API 650 Sec. 7.2.4.1 or approved project specification / client specification",
    acceptanceCriteriaText: "Accepted apabila tidak terdapat indikasi wicking / rembesan / noda minyak pada sisi developer / kapur putih.",
    checklistItems: [
      { label: "Area test kering dan bersih." },
      { label: "Slag dan nonmetallic deposit sudah dibersihkan." },
      { label: "Sambungan Shell to Annular sudah di root weld (tanpa capping / initial pass)." },
      // Trailing blank row: filled in by hand on the printed form.
      { label: "" },
    ],
  },
  {
    code: "NDE-PRA",
    testType: InspectionRequestTypeEnum.PRE_RADIOGRAPHY_TEST,
    title: "PRE-RADIOGRAPHY VISUAL CLEARANCE FORM",
    defaultStandardAndCode: "API 650 Sec. 8.1 (Visual Examination) / approved welding & NDT procedure",
    acceptanceCriteriaText:
      "Accepted apabila hasil visual pengelasan pada seluruh shell course (ring 1 s/d n) memenuhi acceptance criteria dan siap dilanjutkan ke Radiography Test.",
    checklistItems: [
      { label: "Seluruh shell course (ring 1 s/d n) telah selesai difabrikasi dan di-assembly." },
      { label: "Hasil lasan vertical & horizontal bersih dari slag, spatter, oil, grease, dan kontaminan." },
      { label: "Weld capping / weld profile sudah terpenuhi pada seluruh ring." },
      { label: "Tidak terdapat undercut yang melebihi acceptance criteria." },
      { label: "Tidak terdapat cacat visual permukaan (crack, porosity, overlap) yang tidak diterima." },
      { label: "Marking joint / identifikasi welder sudah tersedia untuk keperluan radiography." },
      // Trailing blank row: filled in by hand on the printed form.
      { label: "" },
    ],
  },
  {
    code: "NDE-GEN",
    testType: InspectionRequestTypeEnum.OTHER,
    title: "NDE / INSPECTION CLEARANCE FORM",
    defaultStandardAndCode: "As per approved ITP / approved procedure / project specification",
    acceptanceCriteriaText: "As per approved procedure / project specification.",
    // Empty on purpose: the print form renders 8 blank checklist rows.
    checklistItems: [],
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  // ── Batch 1: Users ──────────────────────────────────────────────────────────
  console.log("👤 Seeding users...");
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: { name: userData.name, role: userData.role },
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: userData.role,
        status: StatusEnum.ACTIVE,
        verifiedAt: new Date(),
      },
    });
    console.log(`  ✅ ${user.role}: ${user.name} (${user.email})`);
  }

  // ── Batch 1: Companies ──────────────────────────────────────────────────────
  console.log("\n🏢 Seeding companies...");
  const companyMap: Record<string, string> = {};
  for (const companyData of companies) {
    const existing = await prisma.company.findFirst({ where: { name: companyData.name, deletedAt: null } });
    const company = existing
      ? await prisma.company.update({ where: { id: existing.id }, data: { name: companyData.name } })
      : await prisma.company.create({ data: companyData });
    companyMap[company.name] = company.id;
    console.log(`  ✅ ${company.type}: ${company.name}`);
  }

  // ── Batch 1: Company personnel (with position + company relation) ─────────────
  console.log("\n👷 Seeding company personnel...");
  for (const personnel of companyPersonnel) {
    const companyId = companyMap[personnel.companyName];
    const user = await prisma.user.upsert({
      where: { email: personnel.email },
      update: { name: personnel.name, role: personnel.role, position: personnel.position, companyId },
      create: {
        email: personnel.email,
        name: personnel.name,
        passwordHash,
        role: personnel.role,
        position: personnel.position,
        companyId,
        status: StatusEnum.ACTIVE,
        verifiedAt: new Date(),
      },
    });
    console.log(`  ✅ ${user.role}: ${user.name} — ${personnel.position} @ ${personnel.companyName}`);
  }

  // ── Batch 2: Reference Documents ────────────────────────────────────────────
  console.log("\n📄 Seeding reference documents...");
  const refDocMap: Record<string, string> = {};
  for (const doc of referenceDocs) {
    const { refCodes: _, ...docData } = doc as any;
    const existing = await prisma.referenceDocument.findUnique({ where: { code: doc.code } });
    const created = existing
      ? await prisma.referenceDocument.update({ where: { id: existing.id }, data: { title: doc.title, status: doc.status } })
      : await prisma.referenceDocument.create({ data: docData });
    refDocMap[doc.code] = created.id;
    console.log(`  ✅ [${created.code}] ${created.title}`);
  }

  // ── Batch 2: Acceptance Criteria + References ────────────────────────────────
  console.log("\n📋 Seeding acceptance criteria...");
  const criteriaMap: Record<string, string> = {};
  for (const ac of acceptanceCriteriaData) {
    const { refCodes, ...criteriaData } = ac;
    const existing = await prisma.acceptanceCriteria.findUnique({ where: { code: ac.code } });
    const created = existing
      ? await prisma.acceptanceCriteria.update({ where: { id: existing.id }, data: { name: ac.name, status: ac.status } })
      : await prisma.acceptanceCriteria.create({ data: criteriaData });
    criteriaMap[ac.code] = created.id;

    for (const refCode of refCodes) {
      const refDocId = refDocMap[refCode];
      if (!refDocId) continue;
      const existingRef = await prisma.criteriaReference.findUnique({
        where: { criteriaId_referenceDocumentId: { criteriaId: created.id, referenceDocumentId: refDocId } },
      });
      if (!existingRef) {
        await prisma.criteriaReference.create({
          data: { criteriaId: created.id, referenceDocumentId: refDocId },
        });
      }
    }
    console.log(`  ✅ [${created.code}] ${created.name}`);
  }

  // ── Batch 2: Process Templates ───────────────────────────────────────────────
  console.log("\n⚙️  Seeding process templates...");
  const processMap: Record<string, string> = {};
  for (const pt of processTemplatesData) {
    const existing = await prisma.processTemplate.findUnique({ where: { code: pt.code } });
    const created = existing
      ? await prisma.processTemplate.update({ where: { id: existing.id }, data: { name: pt.name, sequenceOrder: pt.sequenceOrder } })
      : await prisma.processTemplate.create({ data: pt });
    processMap[pt.code] = created.id;
    console.log(`  ✅ [${created.code}] ${created.name}`);
  }

  // ── Batch 2: Process Criteria Mappings ───────────────────────────────────────
  console.log("\n🔗 Seeding process criteria mappings...");
  for (const [processCode, criteriaCodes] of Object.entries(processCriteriaMappings)) {
    const processId = processMap[processCode];
    if (!processId) continue;
    for (let i = 0; i < criteriaCodes.length; i++) {
      const criteriaId = criteriaMap[criteriaCodes[i]];
      if (!criteriaId) continue;
      const existing = await prisma.processCriteriaTemplate.findUnique({
        where: { processTemplateId_criteriaId: { processTemplateId: processId, criteriaId } },
      });
      if (!existing) {
        await prisma.processCriteriaTemplate.create({
          data: { processTemplateId: processId, criteriaId, sequenceOrder: i + 1 },
        });
      }
    }
    console.log(`  ✅ ${processCode}: ${criteriaCodes.length} criteria mapped`);
  }

  // ── Batch 2: Process Dependencies ────────────────────────────────────────────
  console.log("\n🔀 Seeding process dependencies...");
  for (const [processCode, requiredCodes] of Object.entries(processDependencies)) {
    const processId = processMap[processCode];
    if (!processId) continue;
    for (const requiredCode of requiredCodes) {
      const requiredId = processMap[requiredCode];
      if (!requiredId) continue;
      const existing = await prisma.processDependency.findUnique({
        where: { processTemplateId_requiredProcessTemplateId: { processTemplateId: processId, requiredProcessTemplateId: requiredId } },
      });
      if (!existing) {
        await prisma.processDependency.create({
          data: {
            processTemplateId: processId,
            requiredProcessTemplateId: requiredId,
            requiredStatus: ProcessStatusEnum.COMPLETED,
          },
        });
      }
    }
    console.log(`  ✅ ${processCode} depends on: [${requiredCodes.join(", ")}]`);
  }

  // ── Batch 3: Tank assets + projects ──────────────────────────────────────────
  console.log("\n🛢️  Seeding tank assets and projects...");

  const inspectorUser = await prisma.user.findFirst({ where: { role: RoleEnum.INSPECTOR, deletedAt: null } });
  const contractorCo = await prisma.company.findFirst({ where: { name: "PT Jasa Karya Teknik", deletedAt: null } });
  const inspectionCo = await prisma.company.findFirst({ where: { name: "PT Biro Klasifikasi Indonesia", deletedAt: null } });

  // Tank = physical asset only. Overhaul scheduling/companies live on the project.
  const tanksToSeed = [
    {
      tankNo: "TK-170",
      tankName: "Tangki Timbun TK-170",
      location: TankLocationEnum.SUNGAI_GERONG,
      capacityM3: 13000,
      service: TankServiceEnum.AVTUR,
      diameterMm: 36631,
      heightMm: 12778,
      shellCourseCount: 6,
      hasSteamCoil: true,
      assetStatus: TankAssetStatusEnum.UNDER_OVERHAUL,
    },
    {
      tankNo: "TK-101",
      tankName: "Tangki Timbun TK-101",
      location: TankLocationEnum.PLADJU,
      capacityM3: 5000,
      service: TankServiceEnum.SOLAR,
      diameterMm: 24000,
      heightMm: 11000,
      shellCourseCount: 5,
      hasSteamCoil: false,
      assetStatus: TankAssetStatusEnum.UNDER_OVERHAUL,
    },
    // A10: existing operational tank — only routine monitoring, NO project / workflow.
    {
      tankNo: "A10",
      tankName: "Tangki Timbun A10",
      location: TankLocationEnum.PLADJU,
      capacityM3: 8000,
      service: TankServiceEnum.PERTALITE,
      diameterMm: 28000,
      heightMm: 12000,
      shellCourseCount: 5,
      hasSteamCoil: false,
      assetStatus: TankAssetStatusEnum.OPERATIONAL,
    },
  ];

  for (const tankData of tanksToSeed) {
    // tankNo is globally unique, so match regardless of soft-delete to keep seed idempotent
    const existingTank = await prisma.tank.findFirst({ where: { tankNo: tankData.tankNo } });
    if (!existingTank) {
      await prisma.tank.create({ data: { ...tankData, createdBy: inspectorUser?.id } });
      console.log(`  ✅ Tank created: ${tankData.tankNo} (${tankData.assetStatus})`);
    } else {
      await prisma.tank.update({
        where: { id: existingTank.id },
        data: {
          location: tankData.location,
          capacityM3: tankData.capacityM3,
          service: tankData.service,
          assetStatus: tankData.assetStatus,
          deletedAt: null,
        },
      });
      console.log(`  ℹ️  Tank updated: ${tankData.tankNo}`);
    }
  }

  const tank = await prisma.tank.findFirst({ where: { tankNo: "TK-170", deletedAt: null } });
  if (!tank) throw new Error("TK-170 not found after seeding");

  // Shell courses (asset spec)
  const shellCourses = [
    { courseNo: 1, thicknessMm: 24, plateDimension: "2000x8000 mm" },
    { courseNo: 2, thicknessMm: 21, plateDimension: "2000x8000 mm" },
    { courseNo: 3, thicknessMm: 19, plateDimension: "2000x8000 mm" },
    { courseNo: 4, thicknessMm: 14, plateDimension: "2000x8000 mm" },
    { courseNo: 5, thicknessMm: 13, plateDimension: "2000x8000 mm" },
    { courseNo: 6, thicknessMm: 10, plateDimension: "2000x8000 mm" },
  ];

  for (const sc of shellCourses) {
    const existing = await prisma.tankShellCourse.findUnique({
      where: { tankId_courseNo: { tankId: tank.id, courseNo: sc.courseNo } },
    });
    if (!existing) {
      await prisma.tankShellCourse.create({ data: { tankId: tank.id, ...sc } });
    }
  }
  console.log(`  ✅ Shell courses: ${shellCourses.length} courses seeded`);

  // ── Overhaul projects (each carries its own workflow) ────────────────────────
  const projectsToSeed = [
    {
      tankNo: "TK-170",
      projectNo: "OVH-TK-170-2026",
      startDate: new Date("2026-06-01"),
      estimatedFinishDate: new Date("2026-09-30"),
    },
    {
      tankNo: "TK-101",
      projectNo: "OVH-TK-101-2026",
      startDate: new Date("2026-07-01"),
      estimatedFinishDate: new Date("2026-10-31"),
    },
  ];

  const activeTemplates = await prisma.processTemplate.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { sequenceOrder: "asc" },
    include: { processCriteria: true },
  });

  for (const proj of projectsToSeed) {
    const projectTank = await prisma.tank.findFirst({ where: { tankNo: proj.tankNo, deletedAt: null } });
    if (!projectTank) continue;

    let project = await prisma.tankProject.findFirst({ where: { projectNo: proj.projectNo } });
    if (!project) {
      project = await prisma.tankProject.create({
        data: {
          tankId: projectTank.id,
          projectNo: proj.projectNo,
          type: TankProjectTypeEnum.OVERHAUL,
          status: TankProjectStatusEnum.IN_PROGRESS,
          contractorCompanyId: contractorCo?.id,
          inspectionCompanyId: inspectionCo?.id,
          startDate: proj.startDate,
          estimatedFinishDate: proj.estimatedFinishDate,
          createdBy: inspectorUser?.id,
        },
      });
      console.log(`  ✅ Project created: ${proj.projectNo}`);
    }

    const applicableTemplates = activeTemplates.filter((t) => {
      if (!t.applicabilityRule) return true;
      if (t.applicabilityRule === "STEAM_COIL") return projectTank.hasSteamCoil;
      return true;
    });

    for (const template of applicableTemplates) {
      const existing = await prisma.tankProcess.findUnique({
        where: { projectId_processTemplateId: { projectId: project.id, processTemplateId: template.id } },
      });
      if (existing) continue;

      const tankProcess = await prisma.tankProcess.create({
        data: {
          projectId: project.id,
          processTemplateId: template.id,
          name: template.name,
          type: template.type,
          sequenceOrder: template.sequenceOrder,
          status: ProcessStatusEnum.NOT_STARTED,
        },
      });

      if (template.processCriteria.length > 0) {
        await prisma.checklistResult.createMany({
          data: template.processCriteria.map((pc) => ({
            tankProcessId: tankProcess.id,
            criteriaId: pc.criteriaId,
            status: ChecklistStatusEnum.NOT_CHECKED,
          })),
          skipDuplicates: true,
        });
      }
    }
    console.log(`  ✅ Workflow generated for ${proj.projectNo}`);
  }

  // ── Batch 5: Inspection form templates ───────────────────────────────────────
  console.log("\n🖨️  Seeding inspection form templates...");
  for (const tpl of inspectionFormTemplatesData) {
    const created = await prisma.inspectionFormTemplate.upsert({
      where: { code: tpl.code },
      update: {
        title: tpl.title,
        defaultStandardAndCode: tpl.defaultStandardAndCode,
        acceptanceCriteriaText: tpl.acceptanceCriteriaText,
        checklistItems: tpl.checklistItems,
        isActive: true,
        deletedAt: null,
      },
      create: {
        code: tpl.code,
        testType: tpl.testType,
        title: tpl.title,
        defaultStandardAndCode: tpl.defaultStandardAndCode,
        acceptanceCriteriaText: tpl.acceptanceCriteriaText,
        checklistItems: tpl.checklistItems,
        isActive: true,
      },
    });
    console.log(`  ✅ [${created.code}] ${created.title}`);
  }

  console.log("\n✨ Seeding complete.");
  console.log(`\n📌 Default password for all users: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
