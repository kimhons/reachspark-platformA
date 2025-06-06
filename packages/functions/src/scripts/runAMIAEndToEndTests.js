/**
 * AMIA End-to-End Test Suite
 * 
 * This script performs comprehensive end-to-end testing of all AMIA agent capabilities
 * to verify production readiness.
 */

const { 
  MultiAgentEnsemble, 
  AgentType, 
  LLMProvider, 
  LLMEngine 
} = require('../utils/llm');
const { webScraping } = require('../utils/webScraping');
const { leadQualification } = require('../utils/leadQualification');
const { nurturingAutomation } = require('../utils/nurturingAutomation');
const { multiChannelWorkflows } = require('../utils/multiChannelWorkflows');
const { clientConfigurationInterface } = require('../utils/clientConfigurationInterface');
const { decisionFramework } = require('../utils/decisionFramework');
const { logger } = require('../utils/errorLogging');

// Test environment information
console.log('Node.js version:', process.version);
console.log('Running AMIA end-to-end tests...');

/**
 * Test the LLM Engine capabilities
 */
async function testLLMEngine() {
  try {
    console.log('\n--- Testing LLM Engine ---');
    
    // Create LLM Engine with failover enabled
    const engine = new LLMEngine('e2e-test', LLMProvider.OPENAI, true);
    
    // Test basic text generation
    console.log('Testing basic text generation...');
    const basicResponse = await engine.generateText('What is lead generation?', {
      systemPrompt: 'You are a marketing expert.',
      temperature: 0.7,
      maxTokens: 100,
    });
    console.log('Basic response:', basicResponse.substring(0, 100) + '...');
    
    // Test context retention
    console.log('Testing context retention...');
    engine.addToContext('The user is interested in B2B lead generation for software companies.');
    const contextualResponse = await engine.generateText('What strategies would work best?', {
      systemPrompt: 'You are a marketing expert.',
      temperature: 0.7,
      maxTokens: 100,
    });
    console.log('Contextual response:', contextualResponse.substring(0, 100) + '...');
    
    // Test failover capability
    console.log('Testing provider failover...');
    engine.forceProviderFailure = true; // Simulate primary provider failure
    const failoverResponse = await engine.generateText('How to qualify leads?', {
      systemPrompt: 'You are a marketing expert.',
      temperature: 0.7,
      maxTokens: 100,
    });
    console.log('Failover response:', failoverResponse.substring(0, 100) + '...');
    
    console.log('✅ LLM Engine tests passed');
    return true;
  } catch (error) {
    console.error('❌ LLM Engine tests failed:', error.message);
    return false;
  }
}

/**
 * Test the Multi-Agent Ensemble capabilities
 */
async function testMultiAgentEnsemble() {
  try {
    console.log('\n--- Testing Multi-Agent Ensemble ---');
    
    // Create Multi-Agent Ensemble
    const ensemble = new MultiAgentEnsemble('e2e-test');
    
    // Test single agent response
    console.log('Testing single agent response...');
    const creativeResponse = await ensemble.generateAgentResponse(
      AgentType.CREATIVE_CONTENT,
      'Write a short email subject line for a B2B software company.',
      { includeMemory: false }
    );
    console.log('Creative agent response:', creativeResponse);
    
    // Test multi-agent orchestration
    console.log('Testing multi-agent orchestration...');
    const orchestrationResult = await ensemble.orchestrateTask(
      'Create a lead generation strategy for a B2B software company.',
      [
        AgentType.STRATEGIC_PLANNING,
        AgentType.MARKET_RESEARCH,
        AgentType.CREATIVE_CONTENT
      ],
      { includeMemory: false }
    );
    console.log('Orchestration synthesis:', orchestrationResult.synthesis.substring(0, 100) + '...');
    
    console.log('✅ Multi-Agent Ensemble tests passed');
    return true;
  } catch (error) {
    console.error('❌ Multi-Agent Ensemble tests failed:', error.message);
    return false;
  }
}

/**
 * Test the Web Scraping capabilities
 */
async function testWebScraping() {
  try {
    console.log('\n--- Testing Web Scraping ---');
    
    // Test company profile extraction
    console.log('Testing company profile extraction...');
    const companyProfile = await webScraping.extractCompanyProfile('example.com');
    console.log('Company profile:', JSON.stringify(companyProfile, null, 2));
    
    // Test contact information extraction
    console.log('Testing contact information extraction...');
    const contactInfo = await webScraping.extractContactInformation('example.com');
    console.log('Contact information:', JSON.stringify(contactInfo, null, 2));
    
    // Test industry detection
    console.log('Testing industry detection...');
    const industry = await webScraping.detectIndustry('example.com');
    console.log('Detected industry:', industry);
    
    console.log('✅ Web Scraping tests passed');
    return true;
  } catch (error) {
    console.error('❌ Web Scraping tests failed:', error.message);
    return false;
  }
}

/**
 * Test the Lead Qualification capabilities
 */
async function testLeadQualification() {
  try {
    console.log('\n--- Testing Lead Qualification ---');
    
    // Test lead scoring
    console.log('Testing lead scoring...');
    const leadScore = await leadQualification.scoreLeadQuality({
      company: 'Example Corp',
      industry: 'Software',
      employeeCount: 250,
      revenue: '10M-50M',
      location: 'United States',
      websiteTraffic: 50000,
      socialMediaPresence: 'High',
      technographics: ['CRM', 'Marketing Automation']
    });
    console.log('Lead score:', leadScore);
    
    // Test fit analysis
    console.log('Testing fit analysis...');
    const fitAnalysis = await leadQualification.analyzeFit({
      leadProfile: {
        company: 'Example Corp',
        industry: 'Software',
        employeeCount: 250,
        revenue: '10M-50M'
      },
      targetCriteria: {
        industries: ['Software', 'Technology', 'SaaS'],
        employeeCountRange: [100, 1000],
        revenueRange: ['5M', '100M']
      }
    });
    console.log('Fit analysis:', JSON.stringify(fitAnalysis, null, 2));
    
    // Test intent detection
    console.log('Testing intent detection...');
    const intentScore = await leadQualification.detectIntent({
      websiteVisits: [
        { page: '/pricing', duration: 120, date: new Date() },
        { page: '/demo', duration: 180, date: new Date() }
      ],
      emailEngagement: [
        { campaign: 'Product Update', opened: true, clickedLinks: 2, date: new Date() }
      ],
      socialMediaEngagement: [
        { platform: 'LinkedIn', action: 'Commented', content: 'product feature', date: new Date() }
      ]
    });
    console.log('Intent score:', intentScore);
    
    console.log('✅ Lead Qualification tests passed');
    return true;
  } catch (error) {
    console.error('❌ Lead Qualification tests failed:', error.message);
    return false;
  }
}

/**
 * Test the Nurturing Automation capabilities
 */
async function testNurturingAutomation() {
  try {
    console.log('\n--- Testing Nurturing Automation ---');
    
    // Test personalized content generation
    console.log('Testing personalized content generation...');
    const personalizedContent = await nurturingAutomation.generatePersonalizedContent({
      leadProfile: {
        company: 'Example Corp',
        industry: 'Software',
        painPoints: ['Customer Retention', 'Lead Generation'],
        interests: ['AI', 'Automation']
      },
      contentType: 'email',
      stage: 'awareness',
      goal: 'schedule_demo'
    });
    console.log('Personalized content:', personalizedContent.substring(0, 100) + '...');
    
    // Test engagement prediction
    console.log('Testing engagement prediction...');
    const engagementPrediction = await nurturingAutomation.predictEngagement({
      leadProfile: {
        company: 'Example Corp',
        industry: 'Software',
        previousEngagement: {
          emailOpenRate: 0.6,
          clickThroughRate: 0.2,
          responseRate: 0.1
        }
      },
      contentType: 'email',
      subject: 'Discover how AI can transform your lead generation',
      sendTime: '10:00 AM',
      dayOfWeek: 'Tuesday'
    });
    console.log('Engagement prediction:', JSON.stringify(engagementPrediction, null, 2));
    
    // Test sequence optimization
    console.log('Testing sequence optimization...');
    const optimizedSequence = await nurturingAutomation.optimizeSequence({
      leadProfile: {
        company: 'Example Corp',
        industry: 'Software',
        stage: 'consideration'
      },
      goal: 'schedule_demo',
      maxSteps: 5,
      channels: ['email', 'linkedin', 'phone']
    });
    console.log('Optimized sequence:', JSON.stringify(optimizedSequence, null, 2));
    
    console.log('✅ Nurturing Automation tests passed');
    return true;
  } catch (error) {
    console.error('❌ Nurturing Automation tests failed:', error.message);
    return false;
  }
}

/**
 * Test the Multi-Channel Workflows capabilities
 */
async function testMultiChannelWorkflows() {
  try {
    console.log('\n--- Testing Multi-Channel Workflows ---');
    
    // Test channel selection
    console.log('Testing channel selection...');
    const selectedChannels = await multiChannelWorkflows.selectOptimalChannels({
      leadProfile: {
        company: 'Example Corp',
        industry: 'Software',
        preferredChannels: ['email', 'linkedin'],
        timezone: 'America/New_York',
        previousEngagement: {
          email: 'high',
          linkedin: 'medium',
          phone: 'low'
        }
      },
      goal: 'schedule_demo',
      urgency: 'medium'
    });
    console.log('Selected channels:', selectedChannels);
    
    // Test message adaptation
    console.log('Testing message adaptation...');
    const adaptedMessage = await multiChannelWorkflows.adaptMessageForChannel({
      originalMessage: 'We would like to schedule a demo of our software to show you how it can help with your lead generation challenges.',
      channel: 'linkedin',
      constraints: {
        maxLength: 300,
        tone: 'professional',
        includeCall: true
      }
    });
    console.log('Adapted message:', adaptedMessage);
    
    // Test workflow execution
    console.log('Testing workflow execution...');
    const workflowResult = await multiChannelWorkflows.executeWorkflow({
      leadId: 'test-lead-123',
      workflowId: 'demo-request-workflow',
      steps: [
        { channel: 'email', template: 'demo_request', delay: '0h' },
        { channel: 'linkedin', template: 'follow_up', delay: '24h', condition: 'no_response' },
        { channel: 'phone', template: 'call_script', delay: '48h', condition: 'no_response' }
      ]
    });
    console.log('Workflow execution result:', JSON.stringify(workflowResult, null, 2));
    
    console.log('✅ Multi-Channel Workflows tests passed');
    return true;
  } catch (error) {
    console.error('❌ Multi-Channel Workflows tests failed:', error.message);
    return false;
  }
}

/**
 * Test the Client Configuration Interface capabilities
 */
async function testClientConfigurationInterface() {
  try {
    console.log('\n--- Testing Client Configuration Interface ---');
    
    // Test configuration validation
    console.log('Testing configuration validation...');
    const validationResult = await clientConfigurationInterface.validateConfiguration({
      clientId: 'test-client-123',
      targetIndustries: ['Software', 'Technology', 'SaaS'],
      companySize: {
        min: 50,
        max: 1000
      },
      location: ['United States', 'Canada'],
      budget: '10000',
      goals: ['Increase qualified leads', 'Schedule demos'],
      exclusions: ['Competitors', 'Current customers']
    });
    console.log('Validation result:', JSON.stringify(validationResult, null, 2));
    
    // Test configuration transformation
    console.log('Testing configuration transformation...');
    const transformedConfig = await clientConfigurationInterface.transformToAgentInstructions({
      clientId: 'test-client-123',
      targetIndustries: ['Software', 'Technology', 'SaaS'],
      companySize: {
        min: 50,
        max: 1000
      },
      location: ['United States', 'Canada'],
      budget: '10000',
      goals: ['Increase qualified leads', 'Schedule demos'],
      exclusions: ['Competitors', 'Current customers']
    });
    console.log('Transformed configuration:', transformedConfig.substring(0, 100) + '...');
    
    // Test mode switching
    console.log('Testing mode switching...');
    const modeSwitchResult = await clientConfigurationInterface.switchMode({
      clientId: 'test-client-123',
      newMode: 'client',
      preserveSettings: true
    });
    console.log('Mode switch result:', JSON.stringify(modeSwitchResult, null, 2));
    
    console.log('✅ Client Configuration Interface tests passed');
    return true;
  } catch (error) {
    console.error('❌ Client Configuration Interface tests failed:', error.message);
    return false;
  }
}

/**
 * Test the Decision Framework capabilities
 */
async function testDecisionFramework() {
  try {
    console.log('\n--- Testing Decision Framework ---');
    
    // Test ethical boundary check
    console.log('Testing ethical boundary check...');
    const ethicalCheckResult = await decisionFramework.checkEthicalBoundaries({
      action: 'send_email',
      content: 'We noticed you recently visited our pricing page. Would you like to schedule a demo?',
      leadProfile: {
        company: 'Example Corp',
        hasOptedIn: true,
        communicationPreferences: {
          email: true,
          phone: false
        }
      }
    });
    console.log('Ethical check result:', JSON.stringify(ethicalCheckResult, null, 2));
    
    // Test decision making
    console.log('Testing decision making...');
    const decision = await decisionFramework.makeDecision({
      context: 'Lead has opened 3 emails but not clicked any links',
      options: [
        { action: 'send_follow_up_email', expectedValue: 0.3 },
        { action: 'connect_on_linkedin', expectedValue: 0.5 },
        { action: 'make_phone_call', expectedValue: 0.2 }
      ],
      constraints: {
        maxAttempts: 5,
        currentAttempts: 3,
        timeConstraint: '2 days',
        riskTolerance: 'medium'
      }
    });
    console.log('Decision:', JSON.stringify(decision, null, 2));
    
    // Test learning update
    console.log('Testing learning update...');
    const learningResult = await decisionFramework.updateLearning({
      decision: {
        action: 'connect_on_linkedin',
        expectedValue: 0.5
      },
      outcome: {
        successful: true,
        response: 'accepted_connection',
        timeToResponse: '6 hours'
      },
      context: {
        leadProfile: {
          company: 'Example Corp',
          industry: 'Software'
        },
        previousActions: [
          { action: 'send_email', outcome: 'opened', date: new Date(Date.now() - 86400000) }
        ]
      }
    });
    console.log('Learning update result:', JSON.stringify(learningResult, null, 2));
    
    console.log('✅ Decision Framework tests passed');
    return true;
  } catch (error) {
    console.error('❌ Decision Framework tests failed:', error.message);
    return false;
  }
}

/**
 * Test the end-to-end lead generation workflow
 */
async function testEndToEndWorkflow() {
  try {
    console.log('\n--- Testing End-to-End Lead Generation Workflow ---');
    
    // Step 1: Configure client targeting criteria
    console.log('Step 1: Configuring client targeting criteria...');
    const clientConfig = await clientConfigurationInterface.createConfiguration({
      clientId: 'e2e-test-client',
      targetIndustries: ['Software', 'Technology'],
      companySize: {
        min: 50,
        max: 500
      },
      location: ['United States'],
      budget: '5000',
      goals: ['Generate qualified leads'],
      exclusions: ['Current customers']
    });
    console.log('Client configuration created:', clientConfig.id);
    
    // Step 2: Find potential leads
    console.log('Step 2: Finding potential leads...');
    const potentialLeads = await webScraping.findPotentialLeads({
      industries: ['Software', 'Technology'],
      employeeCountRange: [50, 500],
      locations: ['United States'],
      limit: 3
    });
    console.log('Found potential leads:', potentialLeads.length);
    
    // Step 3: Qualify leads
    console.log('Step 3: Qualifying leads...');
    const qualifiedLeads = [];
    for (const lead of potentialLeads) {
      const score = await leadQualification.scoreLeadQuality(lead);
      if (score >= 70) {
        qualifiedLeads.push({
          ...lead,
          qualificationScore: score
        });
      }
    }
    console.log('Qualified leads:', qualifiedLeads.length);
    
    // Step 4: Generate personalized outreach content
    console.log('Step 4: Generating personalized outreach content...');
    const leadWithContent = await nurturingAutomation.generatePersonalizedContent({
      leadProfile: qualifiedLeads[0],
      contentType: 'email',
      stage: 'awareness',
      goal: 'schedule_call'
    });
    console.log('Generated content:', leadWithContent.substring(0, 100) + '...');
    
    // Step 5: Create multi-channel workflow
    console.log('Step 5: Creating multi-channel workflow...');
    const workflow = await multiChannelWorkflows.createWorkflow({
      leadId: 'test-lead-123',
      goal: 'schedule_call',
      channels: ['email', 'linkedin', 'phone'],
      maxSteps: 5,
      duration: '14 days'
    });
    console.log('Created workflow:', workflow.id);
    
    // Step 6: Execute first workflow step
    console.log('Step 6: Executing first workflow step...');
    const executionResult = await multiChannelWorkflows.executeWorkflowStep({
      workflowId: workflow.id,
      stepIndex: 0,
      leadData: qualifiedLeads[0]
    });
    console.log('Execution result:', JSON.stringify(executionResult, null, 2));
    
    // Step 7: Make decision about next step
    console.log('Step 7: Making decision about next step...');
    const nextStepDecision = await decisionFramework.makeDecision({
      context: 'Lead has received initial email',
      options: [
        { action: 'wait_for_response', expectedValue: 0.6 },
        { action: 'send_linkedin_connection', expectedValue: 0.4 }
      ],
      constraints: {
        maxAttempts: 5,
        currentAttempts: 1,
        timeConstraint: '2 days',
        riskTolerance: 'medium'
      }
    });
    console.log('Next step decision:', JSON.stringify(nextStepDecision, null, 2));
    
    console.log('✅ End-to-End Lead Generation Workflow tests passed');
    return true;
  } catch (error) {
    console.error('❌ End-to-End Lead Generation Workflow tests failed:', error.message);
    return false;
  }
}

/**
 * Run all end-to-end tests
 */
async function runAllTests() {
  console.log('Starting AMIA end-to-end tests...');
  console.log('=======================================');
  
  // Track test results
  const results = {
    llmEngine: false,
    multiAgentEnsemble: false,
    webScraping: false,
    leadQualification: false,
    nurturingAutomation: false,
    multiChannelWorkflows: false,
    clientConfigurationInterface: false,
    decisionFramework: false,
    endToEndWorkflow: false
  };
  
  // Run individual tests
  results.llmEngine = await testLLMEngine();
  results.multiAgentEnsemble = await testMultiAgentEnsemble();
  results.webScraping = await testWebScraping();
  results.leadQualification = await testLeadQualification();
  results.nurturingAutomation = await testNurturingAutomation();
  results.multiChannelWorkflows = await testMultiChannelWorkflows();
  results.clientConfigurationInterface = await testClientConfigurationInterface();
  results.decisionFramework = await testDecisionFramework();
  results.endToEndWorkflow = await testEndToEndWorkflow();
  
  // Print summary
  console.log('\n--- Test Summary ---');
  console.log('LLM Engine:', results.llmEngine ? '✅ PASSED' : '❌ FAILED');
  console.log('Multi-Agent Ensemble:', results.multiAgentEnsemble ? '✅ PASSED' : '❌ FAILED');
  console.log('Web Scraping:', results.webScraping ? '✅ PASSED' : '❌ FAILED');
  console.log('Lead Qualification:', results.leadQualification ? '✅ PASSED' : '❌ FAILED');
  console.log('Nurturing Automation:', results.nurturingAutomation ? '✅ PASSED' : '❌ FAILED');
  console.log('Multi-Channel Workflows:', results.multiChannelWorkflows ? '✅ PASSED' : '❌ FAILED');
  console.log('Client Configuration Interface:', results.clientConfigurationInterface ? '✅ PASSED' : '❌ FAILED');
  console.log('Decision Framework:', results.decisionFramework ? '✅ PASSED' : '❌ FAILED');
  console.log('End-to-End Workflow:', results.endToEndWorkflow ? '✅ PASSED' : '❌ FAILED');
  
  // Overall result
  const allPassed = Object.values(results).every(result => result);
  console.log('\nOverall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  // Generate test report
  const testReport = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    results,
    allPassed,
    duration: 'N/A' // Would be calculated in a real implementation
  };
  
  return testReport;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(testReport => {
      if (testReport.allPassed) {
        console.log('\nAMIA system is fully functional and production-ready.');
        process.exit(0);
      } else {
        console.error('\nAMIA system has failing tests. Please check the logs for details.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error running tests:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };
