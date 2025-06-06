import { BaseAgent } from '../BaseAgent';
import { AgentType, AgentOperation, OperationStatus } from '../types';
import { TokenType } from '../../tokens/types';

interface Patient {
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: string;
  contact: ContactInfo;
  insurance: InsuranceInfo;
  medicalHistory: MedicalHistory;
  appointments: Appointment[];
  documents: PatientDocument[];
  preferences: PatientPreferences;
}

interface ContactInfo {
  email: string;
  phone: string;
  address: Address;
  emergencyContact: EmergencyContact;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber: string;
  coverage: CoverageDetails;
  claims: Claim[];
}

interface CoverageDetails {
  deductible: number;
  copay: number;
  coinsurance: number;
  outOfPocketMax: number;
  benefits: Benefit[];
}

interface Benefit {
  type: string;
  covered: boolean;
  limit: number;
  remaining: number;
}

interface Claim {
  id: string;
  date: Date;
  amount: number;
  status: 'pending' | 'approved' | 'denied';
  details: any;
}

interface MedicalHistory {
  conditions: Condition[];
  medications: Medication[];
  allergies: Allergy[];
  procedures: Procedure[];
  immunizations: Immunization[];
  familyHistory: FamilyHistory[];
}

interface Condition {
  name: string;
  diagnosisDate: Date;
  status: 'active' | 'resolved';
  notes: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  notes: string;
}

interface Allergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes: string;
}

interface Procedure {
  name: string;
  date: Date;
  provider: string;
  notes: string;
  followUp?: FollowUp;
}

interface FollowUp {
  date: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
}

interface Immunization {
  name: string;
  date: Date;
  provider: string;
  nextDue?: Date;
  notes: string;
}

interface FamilyHistory {
  relation: string;
  condition: string;
  ageOfOnset?: number;
  notes: string;
}

interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  type: string;
  date: Date;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string;
  followUp?: FollowUp;
}

interface PatientDocument {
  id: string;
  type: 'medical_record' | 'lab_result' | 'imaging' | 'prescription' | 'referral';
  title: string;
  url: string;
  createdAt: Date;
  status: 'active' | 'archived';
}

interface PatientPreferences {
  communication: CommunicationPreferences;
  appointment: AppointmentPreferences;
  privacy: PrivacyPreferences;
}

interface CommunicationPreferences {
  preferredChannel: 'email' | 'phone' | 'text';
  frequency: 'daily' | 'weekly' | 'monthly';
  topics: string[];
}

interface AppointmentPreferences {
  preferredTime: string;
  preferredProvider: string;
  reminderPreference: 'email' | 'phone' | 'text';
  reminderTime: number; // hours before appointment
}

interface PrivacyPreferences {
  consentLevel: 'basic' | 'detailed' | 'comprehensive';
  sharingPreferences: string[];
  restrictions: string[];
}

export class MedicalPracticeAgent extends BaseAgent {
  private patients: Map<string, Patient>;
  private appointments: Map<string, Appointment>;
  private documents: Map<string, PatientDocument>;
  private providers: Map<string, any>;

  constructor(config: any) {
    super({
      ...config,
      type: AgentType.MEDICAL_PRACTICE,
      capabilities: [
        {
          name: 'patient_management',
          description: 'Manage patient records and care',
          requiredTokens: [TokenType.AI_SERVICE],
          maxConcurrentOperations: 10,
        },
        {
          name: 'appointment_scheduling',
          description: 'Schedule and manage appointments',
          requiredTokens: [TokenType.AI_SERVICE],
          maxConcurrentOperations: 5,
        },
        {
          name: 'insurance_processing',
          description: 'Process insurance claims and verifications',
          requiredTokens: [TokenType.AI_SERVICE],
          maxConcurrentOperations: 3,
        },
      ],
    });

    this.patients = new Map();
    this.appointments = new Map();
    this.documents = new Map();
    this.providers = new Map();
  }

  protected async executeOperation(operation: AgentOperation): Promise<any> {
    const { type, payload } = operation;

    switch (type) {
      case 'create_patient':
        return this.createPatient(payload);
      case 'schedule_appointment':
        return this.scheduleAppointment(payload);
      case 'update_medical_history':
        return this.updateMedicalHistory(payload);
      case 'process_insurance':
        return this.processInsurance(payload);
      case 'generate_report':
        return this.generateReport(payload);
      case 'send_reminder':
        return this.sendReminder(payload);
      default:
        throw new Error(`Unsupported operation type: ${type}`);
    }
  }

  protected validateOperation(operation: AgentOperation): boolean {
    const { type, payload } = operation;
    return (
      typeof type === 'string' &&
      typeof payload === 'object' &&
      payload !== null
    );
  }

  private async createPatient(payload: any): Promise<Patient> {
    const { name, dateOfBirth, gender, contact, insurance } = payload;

    // Validate patient data
    await this.validatePatientData(payload);

    // Create patient
    const patient: Patient = {
      id: `pat-${Date.now()}`,
      name,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      contact,
      insurance,
      medicalHistory: {
        conditions: [],
        medications: [],
        allergies: [],
        procedures: [],
        immunizations: [],
        familyHistory: [],
      },
      appointments: [],
      documents: [],
      preferences: {
        communication: {
          preferredChannel: 'email',
          frequency: 'monthly',
          topics: ['appointments', 'results', 'reminders'],
        },
        appointment: {
          preferredTime: 'morning',
          preferredProvider: '',
          reminderPreference: 'email',
          reminderTime: 24,
        },
        privacy: {
          consentLevel: 'basic',
          sharingPreferences: [],
          restrictions: [],
        },
      },
    };

    this.patients.set(patient.id, patient);
    return patient;
  }

  private async scheduleAppointment(payload: any): Promise<Appointment> {
    const { patientId, providerId, type, date, duration } = payload;

    // Validate patient and provider
    const patient = this.patients.get(patientId);
    const provider = this.providers.get(providerId);
    if (!patient || !provider) {
      throw new Error('Patient or provider not found');
    }

    // Check availability
    await this.checkAvailability(providerId, date, duration);

    // Create appointment
    const appointment: Appointment = {
      id: `apt-${Date.now()}`,
      patientId,
      providerId,
      type,
      date: new Date(date),
      duration,
      status: 'scheduled',
      notes: '',
    };

    // Update patient
    patient.appointments.push(appointment);
    this.patients.set(patientId, patient);

    // Schedule reminder
    await this.scheduleReminder(appointment);

    return appointment;
  }

  private async updateMedicalHistory(payload: any): Promise<MedicalHistory> {
    const { patientId, updates } = payload;
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    // Validate updates
    await this.validateMedicalUpdates(updates);

    // Apply updates
    const updatedHistory = {
      ...patient.medicalHistory,
      ...updates,
    };

    // Update patient
    patient.medicalHistory = updatedHistory;
    this.patients.set(patientId, patient);

    // Generate alerts if needed
    await this.generateMedicalAlerts(updatedHistory);

    return updatedHistory;
  }

  private async processInsurance(payload: any): Promise<any> {
    const { patientId, claimDetails } = payload;
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    // Validate insurance
    await this.validateInsurance(patient.insurance);

    // Process claim
    const claim = await this.submitClaim(patient.insurance, claimDetails);

    // Update patient
    patient.insurance.claims.push(claim);
    this.patients.set(patientId, patient);

    return claim;
  }

  private async generateReport(payload: any): Promise<any> {
    const { type, filters } = payload;

    switch (type) {
      case 'patient_summary':
        return this.generatePatientSummary(filters);
      case 'appointment_summary':
        return this.generateAppointmentSummary(filters);
      case 'insurance_summary':
        return this.generateInsuranceSummary(filters);
      default:
        throw new Error(`Invalid report type: ${type}`);
    }
  }

  private async sendReminder(payload: any): Promise<void> {
    const { appointmentId } = payload;
    const appointment = this.appointments.get(appointmentId);
    if (!appointment) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    const patient = this.patients.get(appointment.patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${appointment.patientId}`);
    }

    // Send reminder based on patient preferences
    await this.sendReminderNotification(patient, appointment);
  }

  private async validatePatientData(payload: any): Promise<void> {
    // Implement patient data validation logic
  }

  private async checkAvailability(providerId: string, date: Date, duration: number): Promise<void> {
    // Implement availability checking logic
  }

  private async scheduleReminder(appointment: Appointment): Promise<void> {
    // Implement reminder scheduling logic
  }

  private async validateMedicalUpdates(updates: any): Promise<void> {
    // Implement medical updates validation logic
  }

  private async generateMedicalAlerts(history: MedicalHistory): Promise<void> {
    // Implement medical alerts generation logic
  }

  private async validateInsurance(insurance: InsuranceInfo): Promise<void> {
    // Implement insurance validation logic
  }

  private async submitClaim(insurance: InsuranceInfo, details: any): Promise<Claim> {
    // Implement claim submission logic
    return {
      id: `clm-${Date.now()}`,
      date: new Date(),
      amount: 0,
      status: 'pending',
      details: {},
    };
  }

  private async generatePatientSummary(filters: any): Promise<any> {
    // Implement patient summary generation logic
    return {};
  }

  private async generateAppointmentSummary(filters: any): Promise<any> {
    // Implement appointment summary generation logic
    return {};
  }

  private async generateInsuranceSummary(filters: any): Promise<any> {
    // Implement insurance summary generation logic
    return {};
  }

  private async sendReminderNotification(patient: Patient, appointment: Appointment): Promise<void> {
    // Implement reminder notification sending logic
  }
} 