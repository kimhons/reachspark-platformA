/**
 * AMIA Test Runner
 * 
 * This script runs the end-to-end test suite for the Autonomous Marketing Intelligence Agent (AMIA)
 * and generates a comprehensive test report to validate production readiness.
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { AMIATestSuite } = require("../utils/amiaTestSuite");
const { logger } = require("../utils/errorLogging");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Run the AMIA test suite and generate a report
 */
async function runAMIATests() {
  try {
    console.log("Starting AMIA end-to-end test suite...");
    
    // Create a unique context ID for this test run
    const contextId = `test-run-${Date.now()}`;
    
    // Initialize the test suite
    const testSuite = new AMIATestSuite(contextId);
    
    // Run all tests
    console.log("Running all tests...");
    const summary = await testSuite.runAllTests();
    
    // Generate HTML report
    console.log("Generating test report...");
    const reportHtml = testSuite.generateTestReport(summary);
    
    // Save report to file
    const reportDir = path.join(__dirname, "../../test-reports");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportPath = path.join(reportDir, `amia-test-report-${Date.now()}.html`);
    fs.writeFileSync(reportPath, reportHtml);
    
    // Save summary to JSON file
    const summaryPath = path.join(reportDir, `amia-test-summary-${Date.now()}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`Test report saved to: ${reportPath}`);
    console.log(`Test summary saved to: ${summaryPath}`);
    
    // Log summary
    console.log("\nTest Summary:");
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests} (${summary.passRate.toFixed(2)}%)`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Skipped: ${summary.skippedTests}`);
    console.log(`Duration: ${summary.duration.toFixed(2)} seconds`);
    
    return {
      success: summary.failedTests === 0,
      summary,
      reportPath,
      summaryPath
    };
  } catch (error) {
    console.error("Error running AMIA tests:", error);
    logger.error("Error running AMIA tests", { error });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runAMIATests()
    .then(result => {
      if (result.success) {
        console.log("\nAMIA tests completed successfully!");
        process.exit(0);
      } else {
        console.error("\nAMIA tests failed!");
        process.exit(1);
      }
    })
    .catch(error => {
      console.error("Error:", error);
      process.exit(1);
    });
}

module.exports = { runAMIATests };
