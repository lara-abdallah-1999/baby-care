import type { Baby, LabRequest, MotherAdmission } from "../types";
export const mothers: MotherAdmission[] = [
  {
    id: "m1",
    name: "Layla Haddad",
    middleName: "Karim",
    patientId: "PT-10482",
    birthDate: "1995-03-18",
    bed: "204-A",
    bloodType: "O+",
    previousChildrenCount: 1,
    doctorName: "Dr. R. Khalil",
    phone: "+961 70 000 127",
    caseNumber: "CASE-2026-00127",
    admissionNumber: "ADM-260641",
    admittedAt: "2026-10-06T07:15",
    ward: "Maternity · Room 204",
    status: "Active",
  },
  {
    id: "m3",
    name: "Rania Mansour",
    middleName: "Rami",
    patientId: "PT-10540",
    caseNumber: "CASE-2026-00129",
    admissionNumber: "ADM-260643",
    admittedAt: "2026-10-06T01:30",
    ward: "Maternity ? Room 208",
    status: "Active",
  },
  {
    id: "m2",
    name: "Nour Khoury",
    middleName: "Samir",
    patientId: "PT-10516",
    phone: "+961 70 000 128",
    caseNumber: "CASE-2026-00128",
    admissionNumber: "ADM-260642",
    admittedAt: "2026-10-06T06:30",
    ward: "Maternity · Room 206",
    status: "Active",
  },
  {
    id: "m4",
    name: "Maya Saad",
    patientId: "PT-10401",
    phone: "+961 70 000 130",
    caseNumber: "CASE-2026-00130",
    admissionNumber: "ADM-260590",
    admittedAt: "2026-10-01T08:00",
    ward: "Maternity · Room 202",
    status: "Discharged",
  },
  {
    id: "m5",
    name: "Rana Nasser",
    patientId: "PT-10562",
    phone: "+961 70 000 131",
    caseNumber: "CASE-2026-00131",
    admissionNumber: "ADM-260644",
    admittedAt: "2026-10-06T09:00",
    ward: "Maternity · Room 210",
    status: "Active",
  },
];
export const babies: Baby[] = [
  ["b1", "m1", 1, "Female", "09:42", 3.2],
  ["b2", "m2", 1, "Male", "08:12", 2.8],
  ["b3", "m2", 2, "Female", "08:16", 2.6],
  ["b4", "m3", 1, "Female", "02:10", 2.4],
  ["b5", "m3", 2, "Male", "02:14", 2.3],
  ["b6", "m3", 3, "Female", "02:18", 2.2],
].map(([id, motherId, number, gender, birthTime, weight]) => ({
  id: String(id),
  motherId: String(motherId),
  number: Number(number),
  gender: gender as Baby["gender"],
  birthTime: String(birthTime),
  weight: Number(weight),
  birthDate: "2026-10-06",
  identifier: `Baby ${number}`,
  personId: `person-${id}`,
  mrn: `NB-260${String(id).slice(1).padStart(3, "0")}`,
  firstName: (
    { b1: "Maya", b2: "Adam", b3: "Lea", b4: "Mira", b5: "Jad", b6: "Rami" } as Record<
      string,
      string
    >
  )[String(id)],
  middleName: motherId === "m1" ? "Karim" : motherId === "m2" ? "Samir" : "Rami",
  lastName: motherId === "m1" ? "Haddad" : motherId === "m2" ? "Khoury" : "Mansour",
}));
export const requests: LabRequest[] = [
  ["LAB-260801", "m1", "b1", "Bilirubin, total", "Routine"],
  ["LAB-260802", "m1", "b1", "Complete blood count", "Urgent"],
  ["LAB-260803", "m2", "b2", "Blood group & Rh", "Routine"],
  ["LAB-260804", "m3", "b4", "Bilirubin, total", "Routine"],
  ["LAB-260805", "m3", "b5", "Complete blood count", "Routine"],
  ["LAB-260806", "m1", null, "Complete blood count", "Routine"],
  ["LAB-260807", "m2", null, "Blood group & Rh", "Routine"],
  ["LAB-260808", "m3", null, "Complete blood count", "Urgent"],
].map(([id, motherId, babyId, test, priority]) => ({
  id: id!,
  motherId: motherId!,
  babyId,
  test: test!,
  tests: id === "LAB-260801" ? [test!, "Bilirubin, direct"] : [test!],
  priority: priority as LabRequest["priority"],
  requestedBy: "Dr. R. Khalil",
  requestedAt: "2026-10-06T10:15",
  status: "Pending",
}));
// Rolling demo records keep all dashboard date ranges populated.
// Existing admission examples above remain unchanged.
const demoToday = new Date();
function demoDate(daysAgo: number) {
  const date = new Date(
    demoToday.getFullYear(),
    demoToday.getMonth(),
    demoToday.getDate() - daysAgo,
  );
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const demoNames = ["Sara", "Dalia", "Hala", "Yara", "Reem", "Lina", "Salma", "Tala"];
const demoFamilies = ["Azar", "Farah", "Saleh", "Aboud", "Najjar", "Hanna", "Saba", "Raad"];
const demoBloodTypes = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"];
const demoProcedures = [
  "Bilirubin, total",
  "Complete blood count",
  "Blood group & Rh",
  "Bilirubin, direct",
];
const demoDailyCounts = [
  4, 2, 6, 3, 5, 1, 4, 2, 3, 1, 5, 2, 4, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 4, 1,
];
let demoRecordNumber = 0;
for (const [daysAgo, count] of demoDailyCounts.entries()) {
  for (let index = 0; index < count; index++) {
    const number = ++demoRecordNumber;
    const motherId = `demo-m-${number}`;
    const babyId = `demo-b-${number}`;
    const date = demoDate(daysAgo);
    const family = demoFamilies[number % demoFamilies.length];
    const motherName = demoNames[number % demoNames.length];
    const doctor = ["Dr. R. Khalil", "Dr. S. Daher", "Dr. M. Salameh"][number % 3];
    mothers.push({
      id: motherId,
      name: `${motherName} ${family}`,
      middleName: "Samir",
      patientId: `PT-DEMO-${number.toString().padStart(4, "0")}`,
      birthDate: `${1990 + (number % 12)}-04-12`,
      bed: `${1 + (number % 2)}`,
      room: `Room ${201 + (number % 12)}`,
      bloodType: demoBloodTypes[number % 8],
      doctorName: doctor,
      caseNumber: `CASE-DEMO-${number.toString().padStart(4, "0")}`,
      admissionNumber: `ADM-DEMO-${number.toString().padStart(4, "0")}`,
      // Some mothers were admitted the evening before delivery.
      admittedAt: `${demoDate(daysAgo + (number % 4 === 0 ? 1 : 0))}T06:30`,
      ward: "Maternity",
      status: daysAgo < 5 ? "Active" : "Discharged",
    });
    babies.push({
      id: babyId,
      motherId,
      number: 1,
      identifier: "Baby 1",
      personId: `person-${babyId}`,
      mrn: `NB-DEMO-${number.toString().padStart(4, "0")}`,
      firstName: `Baby of ${motherName}`,
      middleName: "Samir",
      lastName: family,
      gender: number % 3 === 0 ? "Female" : "Male",
      birthDate: date,
      birthTime: `0${7 + (index % 3)}:${index % 2 ? "35" : "15"}`,
      weight: Number((2.3 + (number % 15) / 10).toFixed(1)),
      height: 48 + (number % 5),
      headCircumference: 33 + (number % 3),
      maturityStatus: "Term",
      bloodType: demoBloodTypes[(number + 2) % 8],
    });
    // Include children without requests and children with multiple requests.
    const requestCount = number % 5 === 0 ? 0 : number % 3 === 0 ? 2 : 1;
    for (let requestIndex = 0; requestIndex < requestCount; requestIndex++) {
      const test = demoProcedures[(number + requestIndex) % demoProcedures.length];
      requests.push({
        id: `LAB-DEMO-${number.toString().padStart(4, "0")}-${requestIndex + 1}`,
        motherId,
        babyId,
        test,
        tests: [test],
        requestedBy: doctor,
        requestedAt: `${date}T10:${requestIndex ? "45" : "15"}`,
        priority: number % 4 === 0 ? "Urgent" : "Routine",
        status: daysAgo >= 5 || (number + requestIndex) % 3 === 0 ? "Ready" : "Pending",
      });
    }
  }
}

// Fictional result examples for previewing completed lab requests.
for (const request of requests) {
  if (!request.id.startsWith("LAB-DEMO-") || request.status !== "Ready") continue;
  const number = Number(request.id.split("-")[2]);
  if (number % 2 === 0) {
    request.resultStatus = "Processing";
    continue;
  }
  const reportedAt = request.requestedAt.slice(0, 10) + "T14:30";
  request.resultStatus = "Results available";
  request.results =
    request.test === "Complete blood count"
      ? [
          { test: "Hemoglobin", value: "16.8", unit: "g/dL", reportedAt },
          { test: "White blood cells", value: "14.2", unit: "10^3/uL", reportedAt },
          { test: "Platelets", value: "245", unit: "10^3/uL", reportedAt },
        ]
      : request.test === "Blood group & Rh"
        ? [
            { test: "ABO blood group", value: "O", reportedAt },
            { test: "Rh (D)", value: "Positive", reportedAt },
          ]
        : [
            {
              test: request.test,
              value: request.test === "Bilirubin, direct" ? "0.3" : "5.2",
              unit: "mg/dL",
              reportedAt,
            },
          ];
}
