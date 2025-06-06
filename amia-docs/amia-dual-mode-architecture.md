# Updated AMIA Architecture with Dual-Mode Lead Generation

## 1. System Overview

The ReachSpark Autonomous Marketing Intelligence Agent (AMIA) is designed as a fully autonomous system that operates in two distinct modes:

1. **Default Mode**: Working 24/7 to find and convert leads for ReachSpark itself
2. **Client Mode**: Working for specific clients based on their configured parameters

This dual-mode architecture allows the system to serve both as ReachSpark's own lead generation engine and as a service offering for clients.

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         OWNER/CLIENT INTERFACE LAYER                    │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐  │
│  │  Dashboard  │    │  Approvals  │    │ Config Mgmt │    │ Reporting │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         AGENT COGNITIVE CORE                            │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐  │
│  │  LLM Engine │    │Memory System│    │Decision Logic│    │ Learning │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
          ▲                 ▲                  ▲                 ▲
          │                 │                  │                 │
          ▼                 ▼                  ▼                 ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │    │              │
│ LEAD SOURCE  │    │ ENGAGEMENT   │    │ CONVERSION   │    │ OPTIMIZATION │
│    MODULE    │    │   MODULE     │    │   MODULE     │    │    MODULE    │
│              │    │              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                  │                   │                   │
       ▼                  ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Web Scraping  │    │Multi-Channel │    │Lead Closing  │    │Ad Management │
│Lead Discovery│    │Communication │    │Onboarding    │    │Budget Control│
│Qualification │    │Personalization│   │Support       │    │Analytics     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                  │                   │                   │
       └──────────────────┼───────────────────┼───────────────────┘
                          │                   │
                          ▼                   ▼
                   ┌─────────────────────────────────┐
                   │                                 │
                   │      EXTERNAL SYSTEMS           │
                   │  (Web, Social Media, Email,     │
                   │   CRM, Ad Platforms, etc.)      │
                   │                                 │
                   └─────────────────────────────────┘
```

## 3. Client Configuration Interface

### 3.1 Client Configuration Form

The client configuration interface allows clients to specify detailed parameters for lead generation:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│               CLIENT CONFIGURATION INTERFACE                │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Industry Select  │    │ Target Company  │                 │
│  │ & Customization │    │ Characteristics │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Lead Profile    │    │ Engagement      │                 │
│  │ Definition      │    │ Preferences     │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Budget &        │    │ Performance     │                 │
│  │ Timeline        │    │ Goals           │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│               CLIENT CONFIGURATION PROCESSOR                │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Parameter       │    │ Strategy        │                 │
│  │ Validation      │    │ Generation      │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │ Resource        │    │ Agent           │                 │
│  │ Allocation      │    │ Configuration   │                 │
│  └─────────────────┘    └─────────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                 To Agent Cognitive Core
```

### 3.2 Client Configuration Data Model

```
ClientConfiguration {
    id: string
    clientId: string
    name: string
    status: "active" | "paused" | "completed"
    
    // Industry and Target Parameters
    industry: string
    subIndustry: string[]
    companySize: {
        min: number
        max: number
    }
    geographicFocus: string[]
    technographics: string[]
    
    // Lead Profile Parameters
    targetRoles: string[]
    decisionMakerLevel: string[]
    painPoints: string[]
    budgetRange: {
        min: number
        max: number
    }
    
    // Engagement Parameters
    communicationChannels: string[]
    communicationTone: string
    contentPreferences: string[]
    
    // Campaign Parameters
    budget: number
    startDate: Date
    endDate: Date
    targetLeadCount: number
    
    // Performance Goals
    conversionTarget: number
    costPerLead: number
    
    // Advanced Configuration
    customKeywords: string[]
    exclusionCriteria: string[]
    priorityScore: number
    
    // Timestamps
    createdAt: Date
    updatedAt: Date
}
```

## 4. Dual-Mode Operation Flow

### 4.1 Mode Selection and Configuration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  User Login ├────►│ Select Mode ├────►│ Configure   │
│             │     │             │     │ Parameters  │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Activate   │◄────┤ Review      │◄────┤ Generate    │
│  Agent      │     │ Strategy    │     │ Strategy    │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Monitor    ├────►│ Adjust      ├────►│ Review      │
│  Performance │     │ Parameters  │     │ Results     │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 4.2 Default Mode Operation (ReachSpark Lead Generation)

In Default Mode, the agent operates with pre-configured parameters optimized for ReachSpark's target market:

1. **Target Industries**: SaaS, E-commerce, Digital Marketing, etc.
2. **Company Size**: SMB to Mid-Market
3. **Decision Makers**: Marketing Directors, CMOs, Growth Managers
4. **Pain Points**: Lead generation, marketing automation, ROI tracking

The agent continuously:
- Discovers potential leads across multiple channels
- Qualifies leads based on fit and intent
- Engages leads with personalized outreach
- Nurtures relationships through the sales funnel
- Converts qualified prospects to ReachSpark customers

### 4.3 Client Mode Operation (Client-Specific Lead Generation)

In Client Mode, the agent operates based on client-specified parameters:

1. **Initialization**: Client completes detailed configuration form
2. **Strategy Generation**: System creates custom lead generation strategy
3. **Approval Workflow**: Client reviews and approves strategy
4. **Execution**: Agent executes strategy across channels
5. **Monitoring**: Client dashboard shows real-time performance
6. **Optimization**: Agent continuously improves based on results
7. **Reporting**: Detailed analytics and lead information provided

## 5. Component Details for Dual-Mode Support

### 5.1 Owner/Client Interface Layer

The interface layer now supports both ReachSpark owners and clients:

#### 5.1.1 Dashboard Component
- **Default Mode Features**:
  - ReachSpark lead pipeline visualization
  - Internal performance metrics
  - Budget utilization for ReachSpark campaigns
  
- **Client Mode Features**:
  - Client-specific lead pipeline
  - Campaign performance for client targets
  - Budget utilization for client campaigns
  - Comparison against benchmarks

#### 5.1.2 Configuration Management
- **Default Mode Features**:
  - ReachSpark target audience definition
  - Internal campaign parameters
  
- **Client Mode Features**:
  - Client-specific targeting form
  - Industry selection and customization
  - Target company characteristics definition
  - Lead profile specification
  - Engagement preferences
  - Budget and timeline settings
  - Performance goals definition

### 5.2 Agent Cognitive Core

The cognitive core now supports context switching between modes:

#### 5.2.1 LLM Engine
- **Mode-Specific Features**:
  - Context awareness of current operational mode
  - Client-specific persona adaptation
  - Industry-specific knowledge activation
  - Target-appropriate content generation

#### 5.2.2 Memory System
- **Mode-Specific Features**:
  - Segregated memory spaces for each client
  - Default mode global memory
  - Client-specific interaction history
  - Mode-appropriate pattern recognition

#### 5.2.3 Decision Logic
- **Mode-Specific Features**:
  - Client-specific decision criteria
  - Custom risk assessment thresholds
  - Client-defined prioritization rules
  - Mode-appropriate ethical boundaries

### 5.3 Lead Source Module

#### 5.3.1 Web Scraping Component
- **Mode-Specific Features**:
  - Target-specific source selection
  - Industry-focused scraping patterns
  - Client-defined keyword monitoring
  - Custom exclusion criteria

#### 5.3.2 Lead Qualification Component
- **Mode-Specific Features**:
  - Client-defined ideal customer profile matching
  - Custom qualification thresholds
  - Industry-specific scoring algorithms
  - Client priority-based ranking

## 6. Data Architecture for Dual-Mode Support

### 6.1 Extended Data Models

#### 6.1.1 Mode Configuration Data Model
```
ModeConfiguration {
    id: string
    type: "default" | "client"
    ownerId: string
    clientId: string (null for default mode)
    status: "active" | "paused" | "archived"
    
    // Configuration Parameters
    parameters: ClientConfiguration | DefaultConfiguration
    
    // Operational Settings
    aggressiveness: number (1-10)
    channelPriorities: Map<string, number>
    budgetAllocation: Map<string, number>
    
    // Performance Metrics
    leadCount: number
    qualifiedLeadCount: number
    conversionCount: number
    conversionRate: number
    costPerLead: number
    costPerConversion: number
    roi: number
    
    // Timestamps
    createdAt: Date
    updatedAt: Date
    lastRunAt: Date
}
```

#### 6.1.2 Lead Data Model with Mode Attribution
```
Lead {
    id: string
    modeId: string
    modeType: "default" | "client"
    clientId: string (null for default mode)
    
    // Lead Information
    name: string
    company: string
    position: string
    email: string
    phone: string
    socialProfiles: Map<string, string>
    
    // Qualification Data
    score: number
    stage: "discovered" | "qualified" | "engaged" | "nurturing" | "opportunity" | "converted" | "lost"
    fitScore: number
    intentScore: number
    budget: number
    authority: number
    need: number
    timeline: number
    
    // Interaction Data
    interactions: Interaction[]
    nextAction: {
        type: string
        scheduledFor: Date
        channel: string
        content: string
    }
    
    // Timestamps
    discoveredAt: Date
    qualifiedAt: Date
    convertedAt: Date
    updatedAt: Date
}
```

## 7. Security and Compliance for Dual-Mode

### 7.1 Data Isolation
- Client data is strictly isolated from other clients
- Default mode data is accessible only to ReachSpark administrators
- Multi-tenant architecture with logical data separation

### 7.2 Client Access Controls
- Role-based access within client organizations
- Granular permissions for viewing and configuring
- Audit logging of all client actions
- Two-factor authentication for sensitive operations

### 7.3 Compliance Mechanisms
- Client-specific compliance rules can be configured
- Industry-specific regulations are automatically applied
- Geographic restrictions honored based on client location
- Data retention policies configurable per client

## 8. Implementation Priorities for Dual-Mode Support

1. **Core Infrastructure**:
   - Multi-tenant data architecture
   - Mode switching mechanism
   - Client configuration storage

2. **Client Interface**:
   - Configuration form development
   - Client dashboard implementation
   - Results visualization

3. **Agent Adaptation**:
   - Context-aware LLM prompting
   - Client-specific memory partitioning
   - Mode-appropriate decision thresholds

4. **Lead Generation Specialization**:
   - Industry-specific scraping patterns
   - Custom qualification criteria
   - Personalized engagement strategies

5. **Reporting and Analytics**:
   - Client-specific performance metrics
   - Comparative benchmarking
   - ROI calculation per client
