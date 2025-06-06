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
  dentalHistory: DentalHistory;
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

interface DentalHistory {
  conditions: Condition[];
  treatments: Treatment[];
  medications: Medication[];
  allergies: Allergy[];
  xrays: XRay[];
  notes: string;
}

interface Condition {
  name: string;
  diagnosisDate: Date;
  status: 'active' | 'resolved';
  severity: 'mild' | 'moderate' | 'severe';
  notes: string;
}

interface Treatment {
  name: string;
  date: Date;
  provider: string;
  status: 'planned' | 'in_progress' | 'completed';
  cost: number;
  insuranceCovered: number;
  notes: string;
  followUp?: FollowUp;
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

interface XRay {
  id: string;
  date: Date;
  type: string;
  url: string;
  notes: string;
  findings: string[];
}

interface FollowUp {
  date: Date;
  status: 'scheduled' | 'completed' | 'cancelled';
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
  type: 'medical_record' | 'xray' | 'prescription' | 'referral';
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

export class DentalPracticeAgent extends BaseAgent {
  private patients: Map<string, Patient>;
  private appointments: Map<string, Appointment>;
  private documents: Map<string, PatientDocument>;
  private providers: Map<string, any>;

  constructor(config: any) {
    super({
      ...config,
      type: AgentType.DENTAL_PRACTICE,
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
          name: 'treatment_planning',
          description: 'Plan and track dental treatments',
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
      case 'update_dental_history':
        return this.updateDentalHistory(payload);
      case 'create_treatment_plan':
        return this.createTreatmentPlan(payload);
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
      dentalHistory: {
        conditions: [],
        treatments: [],
        medications: [],
        allergies: [],
        xrays: [],
        notes: '',
      },
      appointments: [],
      documents: [],
      preferences: {
        communication: {
          preferredChannel: 'email',
          frequency: 'monthly',
          topics: ['appointments', 'treatments', 'reminders'],
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

  private async updateDentalHistory(payload: any): Promise<DentalHistory> {
    const { patientId, updates } = payload;
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    // Validate updates
    await this.validateDentalUpdates(updates);

    // Apply updates
    const updatedHistory = {
      ...patient.dentalHistory,
      ...updates,
    };

    // Update patient
    patient.dentalHistory = updatedHistory;
    this.patients.set(patientId, patient);

    // Generate alerts if needed
    await this.generateDentalAlerts(updatedHistory);

    return updatedHistory;
  }

  private async createTreatmentPlan(payload: any): Promise<Treatment[]> {
    const { patientId, treatments } = payload;
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    // Validate treatments
    await this.validateTreatments(treatments);

    // Create treatment plan
    const treatmentPlan = treatments.map(treatment => ({
      ...treatment,
      status: 'planned',
      cost: await this.calculateTreatmentCost(treatment),
      insuranceCovered: await this.calculateInsuranceCoverage(patient.insurance, treatment),
    }));

    // Update patient
    patient.dentalHistory.treatments.push(...treatmentPlan);
    this.patients.set(patientId, patient);

    return treatmentPlan;
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
      case 'treatment_summary':
        return this.generateTreatmentSummary(filters);
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

  private async validateDentalUpdates(updates: any): Promise<void> {
    // Implement dental updates validation logic
  }

  private async generateDentalAlerts(history: DentalHistory): Promise<void> {
    // Implement dental alerts generation logic
  }

  private async validateTreatments(treatments: any[]): Promise<void> {
    // Implement treatments validation logic
  }

  private async calculateTreatmentCost(treatment: any): Promise<number> {
    // Implement treatment cost calculation logic
    return 0;
  }

  private async calculateInsuranceCoverage(insurance: InsuranceInfo, treatment: any): Promise<number> {
    // Implement insurance coverage calculation logic
    return 0;
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

  private async generateTreatmentSummary(filters: any): Promise<any> {
    // Implement treatment summary generation logic
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