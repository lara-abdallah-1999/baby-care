export interface MotherAdmission {
  id: string;
  name: string;
  middleName?: string;
  patientId: string;
  phone?: string;
  birthDate?: string;
  bed?: string;
  room?: string;
  bloodType?: string;
  previousChildrenCount?: number;
  doctorName?: string;
  caseNumber: string;
  admissionNumber: string;
  admittedAt: string;
  ward: string;
  status: "Active" | "Discharged";
}
export interface ChildInput {
  bloodType?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender: "Female" | "Male";
  birthDate: string;
  birthTime: string;
  weight: number;
  height?: number;
  headCircumference?: number;
  maturityStatus?: "" | "Term" | "Preterm" | "Post-term" | "Not assessed";
  maturityNotes?: string;
}
export interface Baby extends ChildInput {
  identifier: string;
  id: string;
  motherId: string;
  personId: string;
  mrn?: string;
  number: number;
}
export interface Person {
  id: string;
  babyId: string;
  name: string;
}
export type RequestStatus = "Pending" | "Ready";
export interface LabRequest {
  id: string;
  motherId: string;
  babyId: string | null;
  test: string;
  tests?: string[];
  requestedBy: string;
  requestedAt: string;
  priority: "Routine" | "Urgent";
  status: RequestStatus;
  resultStatus?: "Awaiting sample" | "Processing" | "Results available";
  results?: {
    test: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    reportedAt?: string;
  }[];
}
export interface AdmissionRequest {
  id: string;
  labRequestId: string;
  NewBornSent: boolean;
}
export interface LabBidiMessageQueueItem {
  requestId: string;
  baby: Baby;
  queuedAt: string;
}
export type FailurePoint = "none" | "network" | "creation" | "queue" | "admission";
