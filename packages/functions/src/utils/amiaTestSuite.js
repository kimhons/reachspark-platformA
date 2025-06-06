/**
 * End-to-End Test Suite for ReachSpark AMIA
 * 
 * This module provides comprehensive testing for the Autonomous Marketing
 * Intelligence Agent, validating all components and their interactions in
 * both ReachSpark and client-specific modes.
 * 
 * The test suite covers:
 * - LLM integration and context management
 * - Memory system and decision framework
 * - Web scraping and lead identification
 * - Lead qualification and nurturing
 * - Multi-channel workflows and conversion tracking
 * - Data models and storage
 * - Client configuration interface
 * - Error handling and compliance controls
 */

const admin = require("firebase-admin");
const { logger, ReachSparkError, ErrorTypes, SeverityLevels } = require("./errorLogging");
const { LLMProvider, LLMEngine } = require("./llm");
const { DecisionFramework, OperationMode } = require("./decisionFramework");
const { WebScraper } = require("./webScraping");
const { LeadQualifier, QualificationStatus } = require("./leadQualification");
const { NurturingAutomation } = require("./nurturingAutomation");
const { MultiChannelWorkflows, ChannelType, ContactStatus, ConversionType } = require("./multiChannelWorkflows");
const { DataModels, LeadSourceType, LeadStatus, IndustryType, CompanySizeRange } = require("./dataModels");
const { ClientConfigurationInterface, LeadQualityPreference, EngagementFrequency } = require("./clientConfigurationInterface");

// Initialize Firestore if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Test result status
 */
const TestStatus = {
  PASSED: "passed",
  FAILED: "failed",
  SKIPPED: "skipped"
};

/**
 * End-to-End Test Suite class for AMIA
 */
class AMIATestSuite {
  /**
   * Create a new AMIA Test Suite instance
   * @param {string} contextId - Unique identifier for this test context
   */
  constructor(contextId) {
    this.contextId = contextId;
    this.testResults = [];
    this.startTime = Date.now();
    this.endTime = null;
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.skippedTests = 0;
  }

  /**
   * Run all tests
   * @returns {Promise<Object>} Test results summary
   */
  async runAllTests() {
    try {
      logger.info("Starting AMIA end-to-end test suite", {
        contextId: this.contextId
      });

      // Run tests for each component
      await this.testLLMIntegration();
      await this.testDecisionFramework();
      await this.testWebScraping();
      await this.testLeadQualification();
      await this.testNurturingAutomation();
      await this.testMultiChannelWorkflows();
      await this.testDataModels();
      await this.testClientConfigurationInterface();
      await this.testEndToEndWorkflow();
      await this.testErrorHandling();
      await this.testComplianceControls();

      // Calculate test summary
      this.endTime = Date.now();
      const duration = (this.endTime - this.startTime) / 1000;

      const summary = {
        totalTests: this.totalTests,
        passedTests: this.passedTests,
        failedTests: this.failedTests,
        skippedTests: this.skippedTests,
        passRate: this.totalTests > 0 ? (this.passedTests / this.totalTests) * 100 : 0,
        duration,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date(this.endTime).toISOString(),
        results: this.testResults
      };

      logger.info("AMIA end-to-end test suite completed", {
        contextId: this.contextId,
        summary: {
          totalTests: summary.totalTests,
          passedTests: summary.passedTests,
          failedTests: summary.failedTests,
          passRate: summary.passRate.toFixed(2) + "%",
          duration: duration.toFixed(2) + "s"
        }
      });

      return summary;
    } catch (error) {
      logger.error("Error running AMIA test suite", {
        error,
        contextId: this.contextId
      });

      throw new ReachSparkError(
        "Error running AMIA test suite",
        ErrorTypes.UNKNOWN_ERROR,
        SeverityLevels.ERROR,
        error,
        { contextId: this.contextId }
      );
    }
  }

  /**
   * Record a test result
   * @param {string} component - Component being tested
   * @param {string} testName - Name of the test
   * @param {string} status - Test status (passed, failed, skipped)
   * @param {Object} details - Test details
   */
  recordTestResult(component, testName, status, details = {}) {
    this.totalTests++;

    if (status === TestStatus.PASSED) {
      this.passedTests++;
    } else if (status === TestStatus.FAILED) {
      this.failedTests++;
    } else if (status === TestStatus.SKIPPED) {
      this.skippedTests++;
    }

    const result = {
      component,
      testName,
      status,
      timestamp: new Date().toISOString(),
      details
    };

    this.testResults.push(result);

    // Log test result
    const logLevel = status === TestStatus.PASSED ? "info" : status === TestStatus.FAILED ? "error" : "warn";
    logger[logLevel](`Test ${status}: ${component} - ${testName}`, {
      contextId: this.contextId,
      details
    });

    return result;
  }

  /**
   * Test LLM integration
   * @returns {Promise<void>}
   */
  async testLLMIntegration() {
    try {
      logger.info("Testing LLM integration", {
        contextId: this.contextId
      });

      // Test OpenAI provider
      const openaiEngine = new LLMEngine(this.contextId, LLMProvider.OPENAI);
      const openaiResponse = await openaiEngine.generateText("Summarize the benefits of AI in marketing in one sentence.");

      this.recordTestResult(
        "LLMIntegration",
        "OpenAI Text Generation",
        openaiResponse && openaiResponse.length > 0 ? TestStatus.PASSED : TestStatus.FAILED,
        { response: openaiResponse }
      );

      // Test Google provider
      const googleEngine = new LLMEngine(this.contextId, LLMProvider.GOOGLE);
      const googleResponse = await googleEngine.generateText("Summarize the benefits of AI in marketing in one sentence.");

      this.recordTestResult(
        "LLMIntegration",
        "Google Text Generation",
        googleResponse && googleResponse.length > 0 ? TestStatus.PASSED : TestStatus.FAILED,
        { response: googleResponse }
      );

      // Test provider failover
      const failoverEngine = new LLMEngine(this.contextId, LLMProvider.OPENAI, true);
      failoverEngine.forceProviderFailure = true; // Simulate primary provider failure
      const failoverResponse = await failoverEngine.generateText("Summarize the benefits of AI in marketing in one sentence.");

      this.recordTestResult(
        "LLMIntegration",
        "Provider Failover",
        failoverResponse && failoverResponse.length > 0 ? TestStatus.PASSED : TestStatus.FAILED,
        { response: failoverResponse }
      );

      // Test context management
      const contextEngine = new LLMEngine(this.contextId);
      contextEngine.addToContext("The user is interested in lead generation for a healthcare company.");
      const contextResponse = await contextEngine.generateText("What strategies would be most effective?");

      this.recordTestResult(
        "LLMIntegration",
        "Context Management",
        contextResponse && contextResponse.includes("healthcare") ? TestStatus.PASSED : TestStatus.FAILED,
        { response: contextResponse }
      );
    } catch (error) {
      logger.error("Error testing LLM integration", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "LLMIntegration",
        "LLM Integration Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test decision framework
   * @returns {Promise<void>}
   */
  async testDecisionFramework() {
    try {
      logger.info("Testing decision framework", {
        contextId: this.contextId
      });

      // Test default mode decision making
      const defaultDecisionFramework = new DecisionFramework(this.contextId, OperationMode.DEFAULT);
      const defaultDecision = await defaultDecisionFramework.makeDecision(
        "lead_qualification",
        {
          leadData: {
            name: "John Doe",
            company: "Acme Corp",
            email: "john@acmecorp.com",
            industry: IndustryType.TECHNOLOGY,
            companySize: CompanySizeRange.MEDIUM
          }
        }
      );

      this.recordTestResult(
        "DecisionFramework",
        "Default Mode Decision Making",
        defaultDecision && defaultDecision.action ? TestStatus.PASSED : TestStatus.FAILED,
        { decision: defaultDecision }
      );

      // Test client mode decision making
      const clientDecisionFramework = new DecisionFramework(this.contextId, OperationMode.CLIENT, "client123");
      const clientDecision = await clientDecisionFramework.makeDecision(
        "channel_selection",
        {
          leadData: {
            name: "Jane Smith",
            company: "XYZ Inc",
            email: "jane@xyzinc.com",
            industry: IndustryType.HEALTHCARE,
            companySize: CompanySizeRange.LARGE
          },
          clientPreferences: {
            channelPreferences: {
              priorityOrder: [ChannelType.EMAIL, ChannelType.LINKEDIN, ChannelType.PHONE]
            }
          }
        }
      );

      this.recordTestResult(
        "DecisionFramework",
        "Client Mode Decision Making",
        clientDecision && clientDecision.selectedChannel ? TestStatus.PASSED : TestStatus.FAILED,
        { decision: clientDecision }
      );

      // Test ethical boundaries
      const ethicalDecisionFramework = new DecisionFramework(this.contextId);
      const ethicalDecision = await ethicalDecisionFramework.evaluateEthicalBoundaries(
        "Should I scrape personal contact information from a private social media profile?",
        { context: "lead generation" }
      );

      this.recordTestResult(
        "DecisionFramework",
        "Ethical Boundaries",
        ethicalDecision && ethicalDecision.allowed === false ? TestStatus.PASSED : TestStatus.FAILED,
        { decision: ethicalDecision }
      );

      // Test learning system
      const learningDecisionFramework = new DecisionFramework(this.contextId);
      await learningDecisionFramework.recordOutcome(
        "channel_selection",
        { selectedChannel: ChannelType.EMAIL },
        { successful: true, response: true, conversionType: ConversionType.MEETING_SCHEDULED }
      );

      const improvedDecision = await learningDecisionFramework.makeDecision(
        "channel_selection",
        {
          leadData: {
            name: "Alex Johnson",
            company: "123 Industries",
            email: "alex@123industries.com",
            industry: IndustryType.TECHNOLOGY,
            companySize: CompanySizeRange.SMALL
          }
        }
      );

      this.recordTestResult(
        "DecisionFramework",
        "Learning System",
        improvedDecision && improvedDecision.selectedChannel ? TestStatus.PASSED : TestStatus.FAILED,
        { decision: improvedDecision }
      );
    } catch (error) {
      logger.error("Error testing decision framework", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "DecisionFramework",
        "Decision Framework Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test web scraping
   * @returns {Promise<void>}
   */
  async testWebScraping() {
    try {
      logger.info("Testing web scraping", {
        contextId: this.contextId
      });

      // Test company information scraping
      const webScraper = new WebScraper(this.contextId);
      const companyInfo = await webScraper.scrapeCompanyInfo("acmecorp.com");

      this.recordTestResult(
        "WebScraping",
        "Company Information Scraping",
        companyInfo && companyInfo.name ? TestStatus.PASSED : TestStatus.FAILED,
        { companyInfo }
      );

      // Test lead contact discovery
      const contactInfo = await webScraper.discoverLeadContacts("acmecorp.com", ["CEO", "CTO", "Marketing"]);

      this.recordTestResult(
        "WebScraping",
        "Lead Contact Discovery",
        contactInfo && contactInfo.length > 0 ? TestStatus.PASSED : TestStatus.FAILED,
        { contactCount: contactInfo.length }
      );

      // Test compliance with robots.txt
      const robotsCompliance = await webScraper.checkRobotsTxtCompliance("acmecorp.com", "/about-us");

      this.recordTestResult(
        "WebScraping",
        "Robots.txt Compliance",
        robotsCompliance !== undefined ? TestStatus.PASSED : TestStatus.FAILED,
        { compliant: robotsCompliance }
      );

      // Test rate limiting
      const rateLimitTest = await webScraper.testRateLimiting("acmecorp.com", 5);

      this.recordTestResult(
        "WebScraping",
        "Rate Limiting",
        rateLimitTest && rateLimitTest.success ? TestStatus.PASSED : TestStatus.FAILED,
        { rateLimitTest }
      );

      // Test proxy rotation
      const proxyRotationTest = await webScraper.testProxyRotation("acmecorp.com", 3);

      this.recordTestResult(
        "WebScraping",
        "Proxy Rotation",
        proxyRotationTest && proxyRotationTest.success ? TestStatus.PASSED : TestStatus.FAILED,
        { proxyRotationTest }
      );
    } catch (error) {
      logger.error("Error testing web scraping", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "WebScraping",
        "Web Scraping Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test lead qualification
   * @returns {Promise<void>}
   */
  async testLeadQualification() {
    try {
      logger.info("Testing lead qualification", {
        contextId: this.contextId
      });

      // Test default mode qualification
      const defaultQualifier = new LeadQualifier(this.contextId, OperationMode.DEFAULT);
      const defaultQualification = await defaultQualifier.qualifyLead({
        name: "John Doe",
        company: "Acme Corp",
        email: "john@acmecorp.com",
        phone: "+1234567890",
        industry: IndustryType.TECHNOLOGY,
        companySize: CompanySizeRange.MEDIUM,
        title: "CTO"
      });

      this.recordTestResult(
        "LeadQualification",
        "Default Mode Qualification",
        defaultQualification && defaultQualification.status ? TestStatus.PASSED : TestStatus.FAILED,
        { qualification: defaultQualification }
      );

      // Test client mode qualification
      const clientQualifier = new LeadQualifier(this.contextId, OperationMode.CLIENT, "client123");
      const clientQualification = await clientQualifier.qualifyLead(
        {
          name: "Jane Smith",
          company: "XYZ Inc",
          email: "jane@xyzinc.com",
          phone: "+1987654321",
          industry: IndustryType.HEALTHCARE,
          companySize: CompanySizeRange.LARGE,
          title: "Marketing Director"
        },
        {
          targetIndustries: [IndustryType.HEALTHCARE, IndustryType.TECHNOLOGY],
          targetCompanySizes: [CompanySizeRange.MEDIUM, CompanySizeRange.LARGE],
          leadQualityPreference: LeadQualityPreference.HIGH_QUALITY_LOW_VOLUME
        }
      );

      this.recordTestResult(
        "LeadQualification",
        "Client Mode Qualification",
        clientQualification && clientQualification.status ? TestStatus.PASSED : TestStatus.FAILED,
        { qualification: clientQualification }
      );

      // Test qualification scoring
      const scoringQualifier = new LeadQualifier(this.contextId);
      const scoringResult = await scoringQualifier.scoreLead({
        name: "Alex Johnson",
        company: "123 Industries",
        email: "alex@123industries.com",
        phone: "+1122334455",
        industry: IndustryType.FINANCE,
        companySize: CompanySizeRange.ENTERPRISE,
        title: "CEO",
        website: "123industries.com",
        linkedinUrl: "linkedin.com/in/alexjohnson",
        location: "New York, NY"
      });

      this.recordTestResult(
        "LeadQualification",
        "Qualification Scoring",
        scoringResult && scoringResult.score !== undefined ? TestStatus.PASSED : TestStatus.FAILED,
        { scoringResult }
      );

      // Test enrichment
      const enrichmentResult = await scoringQualifier.enrichLeadData({
        name: "Sarah Williams",
        company: "ABC Corp",
        email: "sarah@abccorp.com"
      });

      this.recordTestResult(
        "LeadQualification",
        "Lead Data Enrichment",
        enrichmentResult && Object.keys(enrichmentResult).length > 3 ? TestStatus.PASSED : TestStatus.FAILED,
        { enrichmentResult }
      );
    } catch (error) {
      logger.error("Error testing lead qualification", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "LeadQualification",
        "Lead Qualification Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test nurturing automation
   * @returns {Promise<void>}
   */
  async testNurturingAutomation() {
    try {
      logger.info("Testing nurturing automation", {
        contextId: this.contextId
      });

      // Test nurturing workflow creation
      const nurturingAutomation = new NurturingAutomation(this.contextId);
      const workflowResult = await nurturingAutomation.createNurturingWorkflow(
        "lead123",
        "default_nurturing",
        {
          name: "John Doe",
          company: "Acme Corp",
          email: "john@acmecorp.com",
          industry: IndustryType.TECHNOLOGY,
          qualificationStatus: QualificationStatus.QUALIFIED
        }
      );

      this.recordTestResult(
        "NurturingAutomation",
        "Nurturing Workflow Creation",
        workflowResult && workflowResult.workflowId ? TestStatus.PASSED : TestStatus.FAILED,
        { workflowResult }
      );

      // Test message generation
      const messageResult = await nurturingAutomation.generateNurturingMessage(
        "lead123",
        ChannelType.EMAIL,
        {
          name: "John Doe",
          company: "Acme Corp",
          industry: IndustryType.TECHNOLOGY
        },
        {
          stage: "initial_outreach",
          previousInteractions: []
        }
      );

      this.recordTestResult(
        "NurturingAutomation",
        "Message Generation",
        messageResult && messageResult.content ? TestStatus.PASSED : TestStatus.FAILED,
        { messageResult }
      );

      // Test workflow execution
      const executionResult = await nurturingAutomation.executeWorkflowStep(
        workflowResult.workflowId,
        "initial_contact",
        {
          leadId: "lead123",
          channelType: ChannelType.EMAIL
        }
      );

      this.recordTestResult(
        "NurturingAutomation",
        "Workflow Execution",
        executionResult && executionResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        { executionResult }
      );

      // Test response handling
      const responseResult = await nurturingAutomation.handleLeadResponse(
        "lead123",
        ChannelType.EMAIL,
        {
          content: "I'm interested in learning more about your services.",
          timestamp: new Date().toISOString(),
          sentiment: "positive"
        }
      );

      this.recordTestResult(
        "NurturingAutomation",
        "Response Handling",
        responseResult && responseResult.nextAction ? TestStatus.PASSED : TestStatus.FAILED,
        { responseResult }
      );

      // Test workflow adaptation
      const adaptationResult = await nurturingAutomation.adaptWorkflowBasedOnResponse(
        workflowResult.workflowId,
        "lead123",
        {
          responseType: "interested",
          channelType: ChannelType.EMAIL,
          content: "I'm interested in learning more about your services."
        }
      );

      this.recordTestResult(
        "NurturingAutomation",
        "Workflow Adaptation",
        adaptationResult && adaptationResult.adaptedWorkflow ? TestStatus.PASSED : TestStatus.FAILED,
        { adaptationResult }
      );
    } catch (error) {
      logger.error("Error testing nurturing automation", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "NurturingAutomation",
        "Nurturing Automation Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test multi-channel workflows
   * @returns {Promise<void>}
   */
  async testMultiChannelWorkflows() {
    try {
      logger.info("Testing multi-channel workflows", {
        contextId: this.contextId
      });

      // Test channel selection
      const multiChannelWorkflows = new MultiChannelWorkflows(this.contextId);
      const channelResult = await multiChannelWorkflows.selectOptimalChannel(
        "lead123",
        {
          name: "John Doe",
          company: "Acme Corp",
          email: "john@acmecorp.com",
          phone: "+1234567890",
          linkedinUrl: "linkedin.com/in/johndoe"
        },
        {
          previousChannels: [],
          channelPreferences: {
            priorityOrder: [ChannelType.EMAIL, ChannelType.LINKEDIN, ChannelType.PHONE]
          }
        }
      );

      this.recordTestResult(
        "MultiChannelWorkflows",
        "Channel Selection",
        channelResult && channelResult.selectedChannel ? TestStatus.PASSED : TestStatus.FAILED,
        { channelResult }
      );

      // Test contact execution
      const contactResult = await multiChannelWorkflows.executeContact(
        "lead123",
        channelResult.selectedChannel,
        {
          name: "John Doe",
          company: "Acme Corp",
          email: "john@acmecorp.com"
        },
        {
          message: "Hello John, I wanted to reach out about our services that might benefit Acme Corp."
        }
      );

      this.recordTestResult(
        "MultiChannelWorkflows",
        "Contact Execution",
        contactResult && contactResult.status ? TestStatus.PASSED : TestStatus.FAILED,
        { contactResult }
      );

      // Test contact tracking
      const trackingResult = await multiChannelWorkflows.trackContactStatus(
        contactResult.contactId,
        ContactStatus.DELIVERED
      );

      this.recordTestResult(
        "MultiChannelWorkflows",
        "Contact Tracking",
        trackingResult && trackingResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        { trackingResult }
      );

      // Test channel escalation
      const escalationResult = await multiChannelWorkflows.escalateToNextChannel(
        "lead123",
        ChannelType.EMAIL,
        {
          name: "John Doe",
          company: "Acme Corp",
          email: "john@acmecorp.com",
          phone: "+1234567890",
          linkedinUrl: "linkedin.com/in/johndoe"
        },
        {
          previousChannels: [ChannelType.EMAIL],
          channelPreferences: {
            priorityOrder: [ChannelType.EMAIL, ChannelType.LINKEDIN, ChannelType.PHONE]
          },
          escalationReason: "no_response"
        }
      );

      this.recordTestResult(
        "MultiChannelWorkflows",
        "Channel Escalation",
        escalationResult && escalationResult.newChannel ? TestStatus.PASSED : TestStatus.FAILED,
        { escalationResult }
      );

      // Test conversion tracking
      const conversionResult = await multiChannelWorkflows.trackConversion(
        "lead123",
        ConversionType.MEETING_SCHEDULED,
        {
          channel: ChannelType.EMAIL,
          timestamp: new Date().toISOString(),
          details: {
            meetingDate: new Date(Date.now() + 86400000).toISOString(),
            meetingDuration: 30
          }
        }
      );

      this.recordTestResult(
        "MultiChannelWorkflows",
        "Conversion Tracking",
        conversionResult && conversionResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        { conversionResult }
      );
    } catch (error) {
      logger.error("Error testing multi-channel workflows", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "MultiChannelWorkflows",
        "Multi-Channel Workflows Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test data models
   * @returns {Promise<void>}
   */
  async testDataModels() {
    try {
      logger.info("Testing data models", {
        contextId: this.contextId
      });

      // Test lead creation in default mode
      const defaultDataModels = new DataModels(this.contextId, OperationMode.DEFAULT);
      const defaultLead = await defaultDataModels.createLead({
        name: "John Doe",
        company: "Acme Corp",
        email: "john@acmecorp.com",
        phone: "+1234567890",
        industry: IndustryType.TECHNOLOGY,
        companySize: CompanySizeRange.MEDIUM,
        source: LeadSourceType.WEB_SCRAPING
      });

      this.recordTestResult(
        "DataModels",
        "Default Mode Lead Creation",
        defaultLead && defaultLead.id ? TestStatus.PASSED : TestStatus.FAILED,
        { leadId: defaultLead.id }
      );

      // Test lead creation in client mode
      const clientDataModels = new DataModels(this.contextId, OperationMode.CLIENT, "client123");
      const clientLead = await clientDataModels.createLead({
        name: "Jane Smith",
        company: "XYZ Inc",
        email: "jane@xyzinc.com",
        phone: "+1987654321",
        industry: IndustryType.HEALTHCARE,
        companySize: CompanySizeRange.LARGE,
        source: LeadSourceType.MANUAL_ENTRY
      });

      this.recordTestResult(
        "DataModels",
        "Client Mode Lead Creation",
        clientLead && clientLead.id ? TestStatus.PASSED : TestStatus.FAILED,
        { leadId: clientLead.id }
      );

      // Test lead update
      const updateResult = await defaultDataModels.updateLead(
        defaultLead.id,
        {
          status: LeadStatus.QUALIFIED,
          qualificationStatus: QualificationStatus.QUALIFIED,
          title: "CTO"
        }
      );

      this.recordTestResult(
        "DataModels",
        "Lead Update",
        updateResult && updateResult.status === LeadStatus.QUALIFIED ? TestStatus.PASSED : TestStatus.FAILED,
        { updateResult }
      );

      // Test engagement creation
      const engagementResult = await defaultDataModels.createEngagement({
        leadId: defaultLead.id,
        channelType: ChannelType.EMAIL,
        status: ContactStatus.SENT,
        content: "Hello John, I wanted to reach out about our services that might benefit Acme Corp."
      });

      this.recordTestResult(
        "DataModels",
        "Engagement Creation",
        engagementResult && engagementResult.id ? TestStatus.PASSED : TestStatus.FAILED,
        { engagementId: engagementResult.id }
      );

      // Test conversion creation
      const conversionResult = await defaultDataModels.createConversion({
        leadId: defaultLead.id,
        conversionType: ConversionType.MEETING_SCHEDULED,
        details: {
          meetingDate: new Date(Date.now() + 86400000).toISOString(),
          meetingDuration: 30
        }
      });

      this.recordTestResult(
        "DataModels",
        "Conversion Creation",
        conversionResult && conversionResult.id ? TestStatus.PASSED : TestStatus.FAILED,
        { conversionId: conversionResult.id }
      );

      // Test client configuration creation
      const configResult = await clientDataModels.createClientConfiguration({
        clientId: "client123",
        clientName: "Test Client",
        targetIndustries: [IndustryType.HEALTHCARE, IndustryType.TECHNOLOGY],
        targetCompanySizes: [CompanySizeRange.MEDIUM, CompanySizeRange.LARGE]
      });

      this.recordTestResult(
        "DataModels",
        "Client Configuration Creation",
        configResult && configResult.id ? TestStatus.PASSED : TestStatus.FAILED,
        { configId: configResult.id }
      );

      // Test workflow creation
      const workflowResult = await defaultDataModels.createWorkflow({
        leadId: defaultLead.id,
        workflowType: "nurturing",
        status: "active",
        currentStepId: "initial_contact",
        steps: [
          {
            id: "initial_contact",
            type: "email",
            completed: false
          },
          {
            id: "follow_up",
            type: "email",
            completed: false
          }
        ]
      });

      this.recordTestResult(
        "DataModels",
        "Workflow Creation",
        workflowResult && workflowResult.id ? TestStatus.PASSED : TestStatus.FAILED,
        { workflowId: workflowResult.id }
      );

      // Test data querying
      const queryResult = await defaultDataModels.findLeads(
        {
          status: LeadStatus.QUALIFIED,
          industry: IndustryType.TECHNOLOGY
        },
        10
      );

      this.recordTestResult(
        "DataModels",
        "Data Querying",
        Array.isArray(queryResult) ? TestStatus.PASSED : TestStatus.FAILED,
        { resultCount: queryResult.length }
      );
    } catch (error) {
      logger.error("Error testing data models", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "DataModels",
        "Data Models Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test client configuration interface
   * @returns {Promise<void>}
   */
  async testClientConfigurationInterface() {
    try {
      logger.info("Testing client configuration interface", {
        contextId: this.contextId
      });

      // Test form schema generation
      const configInterface = new ClientConfigurationInterface(this.contextId);
      const formSchema = configInterface.getConfigurationFormSchema();

      this.recordTestResult(
        "ClientConfigurationInterface",
        "Form Schema Generation",
        formSchema && formSchema.properties ? TestStatus.PASSED : TestStatus.FAILED,
        { schemaSize: JSON.stringify(formSchema).length }
      );

      // Test configuration creation
      const configResult = await configInterface.createClientConfiguration(
        "client456",
        {
          clientName: "Test Client",
          targetIndustries: [IndustryType.FINANCE, IndustryType.TECHNOLOGY],
          targetCompanySizes: [CompanySizeRange.SMALL, CompanySizeRange.MEDIUM],
          leadQualityPreference: LeadQualityPreference.BALANCED_QUALITY_VOLUME,
          engagementFrequency: EngagementFrequency.MEDIUM,
          channelPreferences: {
            priorityOrder: [ChannelType.EMAIL, ChannelType.LINKEDIN, ChannelType.PHONE]
          }
        }
      );

      this.recordTestResult(
        "ClientConfigurationInterface",
        "Configuration Creation",
        configResult && configResult.id ? TestStatus.PASSED : TestStatus.FAILED,
        { configId: configResult.id }
      );

      // Test configuration retrieval
      const retrievalResult = await configInterface.getClientConfiguration("client456");

      this.recordTestResult(
        "ClientConfigurationInterface",
        "Configuration Retrieval",
        retrievalResult && retrievalResult.clientName === "Test Client" ? TestStatus.PASSED : TestStatus.FAILED,
        { configId: retrievalResult ? retrievalResult.id : null }
      );

      // Test configuration update
      const updateResult = await configInterface.updateClientConfiguration(
        configResult.id,
        {
          leadQualityPreference: LeadQualityPreference.HIGH_QUALITY_LOW_VOLUME,
          engagementFrequency: EngagementFrequency.LOW
        }
      );

      this.recordTestResult(
        "ClientConfigurationInterface",
        "Configuration Update",
        updateResult && updateResult.leadQualityPreference === LeadQualityPreference.HIGH_QUALITY_LOW_VOLUME ? TestStatus.PASSED : TestStatus.FAILED,
        { configId: updateResult ? updateResult.id : null }
      );

      // Test default configuration generation
      const defaultConfigResult = await configInterface.generateDefaultConfiguration(
        "client789",
        {
          name: "New Client",
          industry: IndustryType.RETAIL,
          companySize: CompanySizeRange.SMALL
        }
      );

      this.recordTestResult(
        "ClientConfigurationInterface",
        "Default Configuration Generation",
        defaultConfigResult && defaultConfigResult.targetIndustries.includes(IndustryType.RETAIL) ? TestStatus.PASSED : TestStatus.FAILED,
        { config: defaultConfigResult }
      );

      // Test form rendering
      const formHtml = configInterface.renderConfigurationForm(defaultConfigResult);

      this.recordTestResult(
        "ClientConfigurationInterface",
        "Form Rendering",
        formHtml && formHtml.includes("AMIA Client Configuration") ? TestStatus.PASSED : TestStatus.FAILED,
        { htmlLength: formHtml.length }
      );

      // Test summary rendering
      const summaryHtml = configInterface.renderConfigurationSummary(configResult);

      this.recordTestResult(
        "ClientConfigurationInterface",
        "Summary Rendering",
        summaryHtml && summaryHtml.includes("Configuration Summary") ? TestStatus.PASSED : TestStatus.FAILED,
        { htmlLength: summaryHtml.length }
      );
    } catch (error) {
      logger.error("Error testing client configuration interface", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "ClientConfigurationInterface",
        "Client Configuration Interface Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test end-to-end workflow
   * @returns {Promise<void>}
   */
  async testEndToEndWorkflow() {
    try {
      logger.info("Testing end-to-end workflow", {
        contextId: this.contextId
      });

      // Test default mode end-to-end workflow
      const defaultWorkflowResult = await this.runEndToEndWorkflow(OperationMode.DEFAULT);

      this.recordTestResult(
        "EndToEndWorkflow",
        "Default Mode Workflow",
        defaultWorkflowResult && defaultWorkflowResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        { workflowResult: defaultWorkflowResult }
      );

      // Test client mode end-to-end workflow
      const clientWorkflowResult = await this.runEndToEndWorkflow(OperationMode.CLIENT, "client123");

      this.recordTestResult(
        "EndToEndWorkflow",
        "Client Mode Workflow",
        clientWorkflowResult && clientWorkflowResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        { workflowResult: clientWorkflowResult }
      );
    } catch (error) {
      logger.error("Error testing end-to-end workflow", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "EndToEndWorkflow",
        "End-to-End Workflow Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Run end-to-end workflow
   * @param {string} mode - Operation mode
   * @param {string} clientId - Client ID (for client mode)
   * @returns {Promise<Object>} Workflow result
   */
  async runEndToEndWorkflow(mode, clientId = null) {
    try {
      // Step 1: Initialize components
      const llmEngine = new LLMEngine(this.contextId);
      const decisionFramework = new DecisionFramework(this.contextId, mode, clientId);
      const webScraper = new WebScraper(this.contextId);
      const leadQualifier = new LeadQualifier(this.contextId, mode, clientId);
      const nurturingAutomation = new NurturingAutomation(this.contextId, mode, clientId);
      const multiChannelWorkflows = new MultiChannelWorkflows(this.contextId, mode, clientId);
      const dataModels = new DataModels(this.contextId, mode, clientId);

      // Step 2: Discover and create lead
      const companyInfo = await webScraper.scrapeCompanyInfo("acmecorp.com");
      const contactInfo = await webScraper.discoverLeadContacts("acmecorp.com", ["CEO", "CTO"]);
      
      const leadData = {
        name: contactInfo[0].name,
        company: companyInfo.name,
        email: contactInfo[0].email,
        phone: contactInfo[0].phone,
        title: contactInfo[0].title,
        industry: companyInfo.industry,
        companySize: companyInfo.size,
        website: companyInfo.website,
        source: LeadSourceType.WEB_SCRAPING
      };
      
      const lead = await dataModels.createLead(leadData);

      // Step 3: Qualify lead
      const qualification = await leadQualifier.qualifyLead(leadData);
      await dataModels.updateLead(lead.id, {
        qualificationStatus: qualification.status,
        qualificationScore: qualification.score,
        status: qualification.status === QualificationStatus.QUALIFIED ? LeadStatus.QUALIFIED : LeadStatus.DISQUALIFIED
      });

      // If lead is not qualified, end workflow
      if (qualification.status !== QualificationStatus.QUALIFIED) {
        return {
          success: true,
          leadId: lead.id,
          status: "disqualified",
          message: "Lead was disqualified"
        };
      }

      // Step 4: Create nurturing workflow
      const workflow = await nurturingAutomation.createNurturingWorkflow(
        lead.id,
        "standard_nurturing",
        leadData
      );

      // Step 5: Execute initial contact
      const channelDecision = await decisionFramework.makeDecision(
        "channel_selection",
        {
          leadData,
          previousChannels: []
        }
      );

      const selectedChannel = channelDecision.selectedChannel || ChannelType.EMAIL;
      
      const message = await nurturingAutomation.generateNurturingMessage(
        lead.id,
        selectedChannel,
        leadData,
        {
          stage: "initial_outreach",
          previousInteractions: []
        }
      );

      const contact = await multiChannelWorkflows.executeContact(
        lead.id,
        selectedChannel,
        leadData,
        {
          message: message.content
        }
      );

      await dataModels.createEngagement({
        leadId: lead.id,
        channelType: selectedChannel,
        status: ContactStatus.SENT,
        content: message.content
      });

      // Step 6: Simulate response
      const responseSimulation = await this.simulateLeadResponse(lead.id, selectedChannel);
      
      if (responseSimulation.responded) {
        await dataModels.updateLead(lead.id, {
          status: LeadStatus.NURTURING
        });

        await nurturingAutomation.handleLeadResponse(
          lead.id,
          selectedChannel,
          {
            content: responseSimulation.content,
            timestamp: new Date().toISOString(),
            sentiment: responseSimulation.sentiment
          }
        );

        await dataModels.createEngagement({
          leadId: lead.id,
          channelType: selectedChannel,
          status: ContactStatus.RESPONDED,
          content: responseSimulation.content
        });

        // Step 7: Execute follow-up
        const followUpMessage = await nurturingAutomation.generateNurturingMessage(
          lead.id,
          selectedChannel,
          leadData,
          {
            stage: "follow_up",
            previousInteractions: [
              {
                type: "outbound",
                channel: selectedChannel,
                content: message.content
              },
              {
                type: "inbound",
                channel: selectedChannel,
                content: responseSimulation.content
              }
            ]
          }
        );

        const followUpContact = await multiChannelWorkflows.executeContact(
          lead.id,
          selectedChannel,
          leadData,
          {
            message: followUpMessage.content
          }
        );

        await dataModels.createEngagement({
          leadId: lead.id,
          channelType: selectedChannel,
          status: ContactStatus.SENT,
          content: followUpMessage.content
        });

        // Step 8: Simulate conversion
        if (responseSimulation.sentiment === "positive") {
          const conversionSimulation = await this.simulateLeadConversion(lead.id, selectedChannel);
          
          if (conversionSimulation.converted) {
            await dataModels.updateLead(lead.id, {
              status: LeadStatus.OPPORTUNITY
            });

            await dataModels.createConversion({
              leadId: lead.id,
              conversionType: conversionSimulation.type,
              details: conversionSimulation.details
            });

            await multiChannelWorkflows.trackConversion(
              lead.id,
              conversionSimulation.type,
              {
                channel: selectedChannel,
                timestamp: new Date().toISOString(),
                details: conversionSimulation.details
              }
            );
          }
        }
      } else {
        // Step 7: Execute channel escalation if no response
        const escalation = await multiChannelWorkflows.escalateToNextChannel(
          lead.id,
          selectedChannel,
          leadData,
          {
            previousChannels: [selectedChannel],
            escalationReason: "no_response"
          }
        );

        if (escalation.newChannel) {
          const escalationMessage = await nurturingAutomation.generateNurturingMessage(
            lead.id,
            escalation.newChannel,
            leadData,
            {
              stage: "escalation",
              previousInteractions: [
                {
                  type: "outbound",
                  channel: selectedChannel,
                  content: message.content
                }
              ]
            }
          );

          const escalationContact = await multiChannelWorkflows.executeContact(
            lead.id,
            escalation.newChannel,
            leadData,
            {
              message: escalationMessage.content
            }
          );

          await dataModels.createEngagement({
            leadId: lead.id,
            channelType: escalation.newChannel,
            status: ContactStatus.SENT,
            content: escalationMessage.content
          });
        }
      }

      return {
        success: true,
        leadId: lead.id,
        workflowId: workflow.workflowId,
        status: "completed"
      };
    } catch (error) {
      logger.error("Error running end-to-end workflow", {
        error,
        mode,
        clientId,
        contextId: this.contextId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simulate lead response
   * @param {string} leadId - Lead ID
   * @param {string} channel - Channel type
   * @returns {Promise<Object>} Simulation result
   */
  async simulateLeadResponse(leadId, channel) {
    // Simulate 70% response rate
    const responded = Math.random() < 0.7;

    if (!responded) {
      return {
        responded: false
      };
    }

    // Simulate different response sentiments
    const sentiments = ["positive", "neutral", "negative"];
    const sentimentWeights = [0.6, 0.3, 0.1]; // 60% positive, 30% neutral, 10% negative
    
    let sentiment;
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < sentiments.length; i++) {
      cumulativeWeight += sentimentWeights[i];
      if (random < cumulativeWeight) {
        sentiment = sentiments[i];
        break;
      }
    }

    // Generate response content based on sentiment
    let content;
    
    switch (sentiment) {
      case "positive":
        content = "Thanks for reaching out. I'm interested in learning more about your services. Could you provide more information?";
        break;
      case "neutral":
        content = "I received your message. I'm not sure if this is relevant for us right now, but I'm open to hearing more.";
        break;
      case "negative":
        content = "I'm not interested in your services at this time. Please remove me from your contact list.";
        break;
      default:
        content = "Thank you for your message.";
    }

    return {
      responded: true,
      sentiment,
      content,
      channel
    };
  }

  /**
   * Simulate lead conversion
   * @param {string} leadId - Lead ID
   * @param {string} channel - Channel type
   * @returns {Promise<Object>} Simulation result
   */
  async simulateLeadConversion(leadId, channel) {
    // Simulate 50% conversion rate for positive responses
    const converted = Math.random() < 0.5;

    if (!converted) {
      return {
        converted: false
      };
    }

    // Simulate different conversion types
    const conversionTypes = [
      ConversionType.MEETING_SCHEDULED,
      ConversionType.DEMO_REQUESTED,
      ConversionType.CONTENT_DOWNLOADED,
      ConversionType.TRIAL_SIGNUP
    ];
    
    const conversionType = conversionTypes[Math.floor(Math.random() * conversionTypes.length)];
    
    // Generate conversion details based on type
    let details;
    
    switch (conversionType) {
      case ConversionType.MEETING_SCHEDULED:
        details = {
          meetingDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
          meetingDuration: 30,
          meetingType: "discovery"
        };
        break;
      case ConversionType.DEMO_REQUESTED:
        details = {
          demoDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
          demoDuration: 45,
          demoType: "product"
        };
        break;
      case ConversionType.CONTENT_DOWNLOADED:
        details = {
          contentType: "whitepaper",
          contentTitle: "Industry Trends Report",
          downloadDate: new Date().toISOString()
        };
        break;
      case ConversionType.TRIAL_SIGNUP:
        details = {
          trialStartDate: new Date().toISOString(),
          trialDuration: 14, // 14 days
          trialPlan: "professional"
        };
        break;
      default:
        details = {
          timestamp: new Date().toISOString()
        };
    }

    return {
      converted: true,
      type: conversionType,
      details,
      channel
    };
  }

  /**
   * Test error handling
   * @returns {Promise<void>}
   */
  async testErrorHandling() {
    try {
      logger.info("Testing error handling", {
        contextId: this.contextId
      });

      // Test LLM provider failure handling
      const llmEngine = new LLMEngine(this.contextId, LLMProvider.OPENAI, true);
      llmEngine.forceProviderFailure = true; // Simulate primary provider failure
      
      const llmErrorResult = await this.testErrorRecovery(
        "LLM Provider Failure",
        async () => {
          return await llmEngine.generateText("Test prompt");
        }
      );

      this.recordTestResult(
        "ErrorHandling",
        "LLM Provider Failure",
        llmErrorResult.recovered ? TestStatus.PASSED : TestStatus.FAILED,
        { errorResult: llmErrorResult }
      );

      // Test invalid lead data handling
      const dataModels = new DataModels(this.contextId);
      
      const invalidLeadResult = await this.testErrorRecovery(
        "Invalid Lead Data",
        async () => {
          return await dataModels.createLead({
            // Missing required fields
            name: "Test Lead"
          });
        },
        false // We don't expect recovery
      );

      this.recordTestResult(
        "ErrorHandling",
        "Invalid Lead Data",
        !invalidLeadResult.recovered ? TestStatus.PASSED : TestStatus.FAILED,
        { errorResult: invalidLeadResult }
      );

      // Test web scraping failure handling
      const webScraper = new WebScraper(this.contextId);
      webScraper.forceFailure = true; // Simulate scraping failure
      
      const scrapingErrorResult = await this.testErrorRecovery(
        "Web Scraping Failure",
        async () => {
          return await webScraper.scrapeCompanyInfo("nonexistent-domain-123456.com");
        },
        false // We don't expect recovery
      );

      this.recordTestResult(
        "ErrorHandling",
        "Web Scraping Failure",
        !scrapingErrorResult.recovered ? TestStatus.PASSED : TestStatus.FAILED,
        { errorResult: scrapingErrorResult }
      );

      // Test rate limiting handling
      const rateLimitResult = await this.testErrorRecovery(
        "Rate Limiting",
        async () => {
          // Simulate rate limiting by making multiple requests
          for (let i = 0; i < 10; i++) {
            await llmEngine.generateText("Test prompt " + i);
          }
          return "Completed multiple requests";
        }
      );

      this.recordTestResult(
        "ErrorHandling",
        "Rate Limiting",
        rateLimitResult.recovered ? TestStatus.PASSED : TestStatus.FAILED,
        { errorResult: rateLimitResult }
      );

      // Test database operation failure handling
      const dbErrorResult = await this.testErrorRecovery(
        "Database Operation Failure",
        async () => {
          // Simulate database operation failure
          const fakeRef = { id: "fake-id" };
          await dataModels.updateLead(fakeRef.id, { status: LeadStatus.QUALIFIED });
          return "Updated lead";
        },
        false // We don't expect recovery
      );

      this.recordTestResult(
        "ErrorHandling",
        "Database Operation Failure",
        !dbErrorResult.recovered ? TestStatus.PASSED : TestStatus.FAILED,
        { errorResult: dbErrorResult }
      );
    } catch (error) {
      logger.error("Error testing error handling", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "ErrorHandling",
        "Error Handling Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test error recovery
   * @param {string} scenario - Error scenario
   * @param {Function} operation - Operation to test
   * @param {boolean} expectRecovery - Whether recovery is expected
   * @returns {Promise<Object>} Test result
   */
  async testErrorRecovery(scenario, operation, expectRecovery = true) {
    try {
      logger.info(`Testing error recovery: ${scenario}`, {
        contextId: this.contextId
      });

      const result = await operation();
      
      return {
        scenario,
        recovered: true,
        result
      };
    } catch (error) {
      logger.error(`Error in scenario: ${scenario}`, {
        error,
        contextId: this.contextId
      });

      if (expectRecovery) {
        return {
          scenario,
          recovered: false,
          error: error.message
        };
      } else {
        // For scenarios where we expect failure, catching the error is a success
        return {
          scenario,
          recovered: false,
          expectedFailure: true,
          error: error.message
        };
      }
    }
  }

  /**
   * Test compliance controls
   * @returns {Promise<void>}
   */
  async testComplianceControls() {
    try {
      logger.info("Testing compliance controls", {
        contextId: this.contextId
      });

      // Test ethical boundaries
      const decisionFramework = new DecisionFramework(this.contextId);
      
      const ethicalResult = await decisionFramework.evaluateEthicalBoundaries(
        "Should I scrape personal contact information from a private social media profile?",
        { context: "lead generation" }
      );

      this.recordTestResult(
        "ComplianceControls",
        "Ethical Boundaries",
        ethicalResult && ethicalResult.allowed === false ? TestStatus.PASSED : TestStatus.FAILED,
        { ethicalResult }
      );

      // Test data privacy compliance
      const webScraper = new WebScraper(this.contextId);
      
      const privacyResult = await webScraper.checkDataPrivacyCompliance(
        "example.com",
        {
          dataTypes: ["email", "phone", "address"],
          purpose: "marketing"
        }
      );

      this.recordTestResult(
        "ComplianceControls",
        "Data Privacy Compliance",
        privacyResult && privacyResult.compliant !== undefined ? TestStatus.PASSED : TestStatus.FAILED,
        { privacyResult }
      );

      // Test opt-out handling
      const nurturingAutomation = new NurturingAutomation(this.contextId);
      
      const optOutResult = await nurturingAutomation.handleOptOut(
        "lead123",
        ChannelType.EMAIL,
        {
          content: "Please unsubscribe me from your emails.",
          timestamp: new Date().toISOString()
        }
      );

      this.recordTestResult(
        "ComplianceControls",
        "Opt-Out Handling",
        optOutResult && optOutResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        { optOutResult }
      );

      // Test communication frequency limits
      const multiChannelWorkflows = new MultiChannelWorkflows(this.contextId);
      
      const frequencyResult = await multiChannelWorkflows.checkCommunicationFrequencyLimits(
        "lead123",
        ChannelType.EMAIL,
        {
          previousCommunications: [
            { timestamp: new Date(Date.now() - 86400000).toISOString() }, // 1 day ago
            { timestamp: new Date(Date.now() - 172800000).toISOString() } // 2 days ago
          ]
        }
      );

      this.recordTestResult(
        "ComplianceControls",
        "Communication Frequency Limits",
        frequencyResult && frequencyResult.allowCommunication !== undefined ? TestStatus.PASSED : TestStatus.FAILED,
        { frequencyResult }
      );

      // Test data retention policies
      const dataModels = new DataModels(this.contextId);
      
      const retentionResult = await dataModels.applyDataRetentionPolicies(
        {
          leadRetentionDays: 365,
          disqualifiedLeadRetentionDays: 90,
          inactiveLeadRetentionDays: 180
        }
      );

      this.recordTestResult(
        "ComplianceControls",
        "Data Retention Policies",
        retentionResult && retentionResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        { retentionResult }
      );

      // Test audit logging
      const auditResult = await this.testAuditLogging();

      this.recordTestResult(
        "ComplianceControls",
        "Audit Logging",
        auditResult && auditResult.success ? TestStatus.PASSED : TestStatus.FAILED,
        { auditResult }
      );
    } catch (error) {
      logger.error("Error testing compliance controls", {
        error,
        contextId: this.contextId
      });

      this.recordTestResult(
        "ComplianceControls",
        "Compliance Controls Tests",
        TestStatus.FAILED,
        { error: error.message }
      );
    }
  }

  /**
   * Test audit logging
   * @returns {Promise<Object>} Test result
   */
  async testAuditLogging() {
    try {
      // Create test events
      const events = [
        {
          eventType: "lead_created",
          details: {
            leadId: "test-lead-123",
            source: LeadSourceType.WEB_SCRAPING
          }
        },
        {
          eventType: "lead_qualified",
          details: {
            leadId: "test-lead-123",
            qualificationStatus: QualificationStatus.QUALIFIED
          }
        },
        {
          eventType: "engagement_created",
          details: {
            leadId: "test-lead-123",
            channelType: ChannelType.EMAIL
          }
        }
      ];

      // Log test events
      for (const event of events) {
        await db.collection("data_events").add({
          ...event,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          mode: OperationMode.DEFAULT,
          contextId: this.contextId
        });
      }

      // Query logged events
      const snapshot = await db.collection("data_events")
        .where("contextId", "==", this.contextId)
        .orderBy("timestamp", "desc")
        .limit(10)
        .get();

      const loggedEvents = [];
      snapshot.forEach(doc => {
        loggedEvents.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: loggedEvents.length >= events.length,
        eventCount: loggedEvents.length
      };
    } catch (error) {
      logger.error("Error testing audit logging", {
        error,
        contextId: this.contextId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate test report
   * @param {Object} summary - Test summary
   * @returns {string} HTML report
   */
  generateTestReport(summary) {
    try {
      // Generate HTML report
      const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AMIA End-to-End Test Report</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
  <style>
    .report-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .summary-section {
      margin-bottom: 30px;
      padding: 20px;
      border-radius: 5px;
      background-color: #f8f9fa;
    }
    .component-section {
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 5px;
      background-color: #fff;
      border: 1px solid #dee2e6;
    }
    .component-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #dee2e6;
    }
    .test-item {
      margin-bottom: 10px;
      padding: 10px;
      border-radius: 5px;
    }
    .test-passed {
      background-color: #d4edda;
    }
    .test-failed {
      background-color: #f8d7da;
    }
    .test-skipped {
      background-color: #fff3cd;
    }
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 5px;
    }
    .test-details {
      margin-top: 10px;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 5px;
      font-family: monospace;
      font-size: 0.9rem;
    }
    .progress {
      height: 25px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <h1 class="mb-4">AMIA End-to-End Test Report</h1>
    
    <div class="summary-section">
      <h2>Test Summary</h2>
      <div class="row mb-3">
        <div class="col-md-6">
          <p><strong>Start Time:</strong> ${new Date(summary.startTime).toLocaleString()}</p>
          <p><strong>End Time:</strong> ${new Date(summary.endTime).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${summary.duration.toFixed(2)} seconds</p>
        </div>
        <div class="col-md-6">
          <p><strong>Total Tests:</strong> ${summary.totalTests}</p>
          <p><strong>Passed:</strong> ${summary.passedTests} (${summary.passRate.toFixed(2)}%)</p>
          <p><strong>Failed:</strong> ${summary.failedTests}</p>
          <p><strong>Skipped:</strong> ${summary.skippedTests}</p>
        </div>
      </div>
      
      <div class="progress mb-3">
        <div class="progress-bar bg-success" role="progressbar" style="width: ${(summary.passedTests / summary.totalTests) * 100}%" aria-valuenow="${summary.passedTests}" aria-valuemin="0" aria-valuemax="${summary.totalTests}">
          ${summary.passedTests} Passed
        </div>
        <div class="progress-bar bg-danger" role="progressbar" style="width: ${(summary.failedTests / summary.totalTests) * 100}%" aria-valuenow="${summary.failedTests}" aria-valuemin="0" aria-valuemax="${summary.totalTests}">
          ${summary.failedTests} Failed
        </div>
        <div class="progress-bar bg-warning" role="progressbar" style="width: ${(summary.skippedTests / summary.totalTests) * 100}%" aria-valuenow="${summary.skippedTests}" aria-valuemin="0" aria-valuemax="${summary.totalTests}">
          ${summary.skippedTests} Skipped
        </div>
      </div>
    </div>
    
    <div class="component-results">
      <h2 class="mb-3">Component Results</h2>
      
      ${this.generateComponentSections(summary.results)}
    </div>
  </div>
  
  <script>
    // Toggle test details visibility
    document.addEventListener('DOMContentLoaded', function() {
      const detailsToggles = document.querySelectorAll('.details-toggle');
      
      detailsToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
          const detailsId = this.getAttribute('data-target');
          const detailsElement = document.getElementById(detailsId);
          
          if (detailsElement.style.display === 'none') {
            detailsElement.style.display = 'block';
            this.textContent = 'Hide Details';
          } else {
            detailsElement.style.display = 'none';
            this.textContent = 'Show Details';
          }
        });
      });
    });
  </script>
</body>
</html>
      `;

      return reportHtml;
    } catch (error) {
      logger.error("Error generating test report", {
        error,
        contextId: this.contextId
      });

      return `<html><body><h1>Error Generating Report</h1><p>${error.message}</p></body></html>`;
    }
  }

  /**
   * Generate component sections for test report
   * @param {Array<Object>} results - Test results
   * @returns {string} HTML for component sections
   */
  generateComponentSections(results) {
    // Group results by component
    const componentGroups = {};
    
    for (const result of results) {
      if (!componentGroups[result.component]) {
        componentGroups[result.component] = [];
      }
      
      componentGroups[result.component].push(result);
    }

    // Generate HTML for each component
    let html = '';
    
    for (const component in componentGroups) {
      const componentResults = componentGroups[component];
      const passedCount = componentResults.filter(r => r.status === TestStatus.PASSED).length;
      const failedCount = componentResults.filter(r => r.status === TestStatus.FAILED).length;
      const skippedCount = componentResults.filter(r => r.status === TestStatus.SKIPPED).length;
      const totalCount = componentResults.length;
      const passRate = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;
      
      html += `
      <div class="component-section">
        <div class="component-header">
          <h3>${component}</h3>
          <div>
            <span class="badge bg-success">${passedCount} Passed</span>
            <span class="badge bg-danger">${failedCount} Failed</span>
            <span class="badge bg-warning text-dark">${skippedCount} Skipped</span>
            <span class="badge bg-primary">${passRate.toFixed(2)}%</span>
          </div>
        </div>
        
        <div class="progress mb-3">
          <div class="progress-bar bg-success" role="progressbar" style="width: ${(passedCount / totalCount) * 100}%" aria-valuenow="${passedCount}" aria-valuemin="0" aria-valuemax="${totalCount}"></div>
          <div class="progress-bar bg-danger" role="progressbar" style="width: ${(failedCount / totalCount) * 100}%" aria-valuenow="${failedCount}" aria-valuemin="0" aria-valuemax="${totalCount}"></div>
          <div class="progress-bar bg-warning" role="progressbar" style="width: ${(skippedCount / totalCount) * 100}%" aria-valuenow="${skippedCount}" aria-valuemin="0" aria-valuemax="${totalCount}"></div>
        </div>
        
        <div class="test-list">
          ${componentResults.map(result => this.generateTestItem(result)).join('')}
        </div>
      </div>
      `;
    }
    
    return html;
  }

  /**
   * Generate test item for test report
   * @param {Object} result - Test result
   * @returns {string} HTML for test item
   */
  generateTestItem(result) {
    const statusClass = result.status === TestStatus.PASSED ? 'test-passed' : 
                        result.status === TestStatus.FAILED ? 'test-failed' : 'test-skipped';
    
    const detailsId = `details-${result.component}-${result.testName.replace(/\s+/g, '-').toLowerCase()}`;
    
    return `
    <div class="test-item ${statusClass}">
      <div class="test-header">
        <div>
          <strong>${result.testName}</strong>
          <span class="badge ${result.status === TestStatus.PASSED ? 'bg-success' : 
                              result.status === TestStatus.FAILED ? 'bg-danger' : 'bg-warning text-dark'}">
            ${result.status}
          </span>
        </div>
        <button class="btn btn-sm btn-outline-secondary details-toggle" data-target="${detailsId}">Show Details</button>
      </div>
      <div id="${detailsId}" class="test-details" style="display: none;">
        <pre>${JSON.stringify(result.details, null, 2)}</pre>
      </div>
    </div>
    `;
  }
}

module.exports = {
  AMIATestSuite,
  TestStatus
};
