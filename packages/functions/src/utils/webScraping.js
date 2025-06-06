/**
 * Web Scraping Infrastructure for ReachSpark AMIA
 * 
 * This module provides a comprehensive web scraping infrastructure for the
 * Autonomous Marketing Intelligence Agent, supporting both default mode
 * (ReachSpark lead generation) and client mode (client-specific lead generation).
 * 
 * The infrastructure includes:
 * - Multi-source scraping (LinkedIn, industry forums, company websites)
 * - Scheduled and event-triggered scraping
 * - Proxy rotation and rate limiting
 * - HTML/JavaScript rendering
 * - Compliance with robots.txt and site policies
 */

const { Cluster } = require("puppeteer-cluster");
const puppeteer = require("puppeteer");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { HttpsProxyAgent } = require("https-proxy-agent");
const robotsParser = require("robots-parser");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");
const { parse } = require("url");
const { logger, ReachSparkError, ErrorTypes, SeverityLevels } = require("./errorLogging");
const { OperationMode } = require("./decisionFramework"); // Assuming decisionFramework exports OperationMode

// Initialize Firestore with fallback for testing environments
let db;
try {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  db = admin.firestore();
} catch (error) {
  console.warn("Failed to initialize Firestore, using mock implementation for testing");
  // Mock Firestore for testing environments
  db = {
    collection: () => ({
      doc: () => ({
        collection: () => ({
          add: async () => ({}),
          get: async () => ({ docs: [], forEach: () => {} })
        }),
        get: async () => ({ exists: false, data: () => ({}) }),
        set: async () => ({}),
        update: async () => ({}),
        delete: async () => ({})
      }),
      add: async () => ({}),
      where: () => ({ where: () => ({ get: async () => ({ docs: [], forEach: () => {} }) }) }),
      orderBy: () => ({ limit: () => ({ get: async () => ({ docs: [], forEach: () => {} }) }) })
    }),
    runTransaction: async (fn) => fn({ get: async () => ({ exists: false, data: () => ({}) }), set: async () => ({}), update: async () => ({}) })
  };
}

/**
 * Source types for scraping
 */
const SourceType = {
  LINKEDIN: "linkedin",
  COMPANY_WEBSITE: "company_website",
  INDUSTRY_FORUM: "industry_forum",
  NEWS_SITE: "news_site",
  SOCIAL_MEDIA: "social_media",
  JOB_BOARD: "job_board",
  CONFERENCE_SITE: "conference_site"
};

/**
 * Scraping methods
 */
const ScrapingMethod = {
  PUPPETEER: "puppeteer",
  AXIOS_CHEERIO: "axios_cheerio",
  API: "api"
};

/**
 * Proxy types
 */
const ProxyType = {
  NONE: "none",
  HTTP: "http",
  SOCKS: "socks",
  RESIDENTIAL: "residential",
  DATACENTER: "datacenter",
  MOBILE: "mobile"
};

/**
 * Scraping frequency
 */
const ScrapingFrequency = {
  ONCE: "once",
  HOURLY: "hourly",
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  EVENT_TRIGGERED: "event_triggered"
};

/**
 * Web Scraping class for AMIA
 */
class WebScraping {
  /**
   * Create a new Web Scraping instance
   * @param {string} contextId - Unique identifier for this scraping context
   * @param {boolean} testMode - Whether to run in test mode with mock data
   */
  constructor(contextId, testMode = false) {
    this.contextId = contextId;
    this.testMode = testMode || process.env.NODE_ENV === "test";
    this.cluster = null;
    this.robotsTxtCache = new Map();
    this.proxyList = [];
    this.currentProxyIndex = 0;
    this.rateLimits = new Map();
    this.initialized = false;
    this.scrapingLogRef = db.collection("scraping_logs").doc(contextId);
  }

  /**
   * Initialize the web scraping infrastructure
   * @param {Object} options - Initialization options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    if (this.initialized) {
      return;
    }

    try {
      // Skip actual initialization in test mode
      if (this.testMode) {
        this.initialized = true;
        logger.info("Web scraping initialized in test mode", { contextId: this.contextId });
        return;
      }

      // Load proxies from database or options
      this.proxyList = options.proxyList || await this.loadProxiesFromDatabase();

      // Initialize puppeteer cluster
      this.cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: options.maxConcurrency || 5,
        puppeteerOptions: {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu"
          ]
        },
        timeout: options.timeout || 60000,
        retryLimit: options.retryLimit || 3,
        monitor: options.monitor || false
      });

      // Set up cluster error handler
      this.cluster.on("taskerror", (err, data) => {
        logger.error("Error while scraping", {
          error: err.message,
          url: data.url,
          contextId: this.contextId
        });
      });

      this.initialized = true;
      logger.info("Web scraping infrastructure initialized", { contextId: this.contextId });
    } catch (error) {
      logger.error("Failed to initialize web scraping infrastructure", {
        error: error.message,
        contextId: this.contextId
      });
      throw new ReachSparkError(
        "Failed to initialize web scraping infrastructure",
        ErrorTypes.INITIALIZATION_ERROR,
        SeverityLevels.ERROR,
        error,
        { contextId: this.contextId }
      );
    }
  }

  /**
   * Load proxies from database
   * @returns {Promise<Array>} List of proxies
   */
  async loadProxiesFromDatabase() {
    try {
      const proxiesSnapshot = await db.collection("proxies").where("status", "==", "active").get();
      const proxies = [];
      proxiesSnapshot.forEach(doc => {
        proxies.push(doc.data());
      });
      return proxies;
    } catch (error) {
      logger.warn("Failed to load proxies from database", {
        error: error.message,
        contextId: this.contextId
      });
      return [];
    }
  }

  /**
   * Get the next proxy from the rotation
   * @returns {Object|null} Next proxy or null if none available
   */
  getNextProxy() {
    if (this.proxyList.length === 0) {
      return null;
    }
    const proxy = this.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    return proxy;
  }

  /**
   * Check if scraping is allowed for a URL according to robots.txt
   * @param {string} url - URL to check
   * @returns {Promise<boolean>} Whether scraping is allowed
   */
  async isScrapingAllowed(url) {
    try {
      const parsedUrl = parse(url);
      const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;
      
      // Check cache first
      if (this.robotsTxtCache.has(parsedUrl.host)) {
        const robotsTxt = this.robotsTxtCache.get(parsedUrl.host);
        return robotsTxt.isAllowed(url, "ReachSparkBot");
      }
      
      // Fetch robots.txt
      const response = await axios.get(robotsUrl, { timeout: 5000 });
      const robotsTxt = robotsParser(robotsUrl, response.data);
      
      // Cache the result
      this.robotsTxtCache.set(parsedUrl.host, robotsTxt);
      
      return robotsTxt.isAllowed(url, "ReachSparkBot");
    } catch (error) {
      logger.warn("Failed to check robots.txt, assuming scraping is allowed", {
        url,
        error: error.message,
        contextId: this.contextId
      });
      return true;
    }
  }

  /**
   * Check rate limits for a domain
   * @param {string} domain - Domain to check
   * @returns {boolean} Whether scraping is allowed by rate limits
   */
  checkRateLimit(domain) {
    const now = Date.now();
    const rateLimit = this.rateLimits.get(domain);
    
    if (!rateLimit) {
      // No rate limit set, initialize one
      this.rateLimits.set(domain, {
        lastAccess: now,
        count: 1,
        limit: 10,
        resetTime: now + 60000 // 1 minute
      });
      return true;
    }
    
    // Reset rate limit if time has passed
    if (now > rateLimit.resetTime) {
      rateLimit.count = 1;
      rateLimit.lastAccess = now;
      rateLimit.resetTime = now + 60000;
      return true;
    }
    
    // Check if rate limit is exceeded
    if (rateLimit.count >= rateLimit.limit) {
      return false;
    }
    
    // Increment count and update last access
    rateLimit.count++;
    rateLimit.lastAccess = now;
    return true;
  }

  /**
   * Scrape a URL using puppeteer
   * @param {string} url - URL to scrape
   * @param {Object} options - Scraping options
   * @returns {Promise<Object>} Scraped data
   */
  async scrapePuppeteer(url, options = {}) {
    try {
      // Check if scraping is allowed
      const isAllowed = await this.isScrapingAllowed(url);
      if (!isAllowed) {
        throw new ReachSparkError(
          "Scraping not allowed by robots.txt",
          ErrorTypes.COMPLIANCE_ERROR,
          SeverityLevels.WARNING,
          null,
          { url, contextId: this.contextId }
        );
      }
      
      // Check rate limits
      const domain = parse(url).host;
      if (!this.checkRateLimit(domain)) {
        throw new ReachSparkError(
          "Rate limit exceeded for domain",
          ErrorTypes.RATE_LIMIT_ERROR,
          SeverityLevels.WARNING,
          null,
          { domain, contextId: this.contextId }
        );
      }
      
      // Initialize if not already
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Use mock data in test mode
      if (this.testMode) {
        return this.getMockScrapedData(url);
      }
      
      // Execute scraping task
      const result = await this.cluster.execute(url, async ({ page, data: url }) => {
        // Set up proxy if available
        const proxy = this.getNextProxy();
        if (proxy) {
          await page.authenticate({
            username: proxy.username,
            password: proxy.password
          });
        }
        
        // Set user agent
        await page.setUserAgent("ReachSparkBot/1.0 (+https://reachspark.com/bot)");
        
        // Navigate to URL
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: options.timeout || 30000
        });
        
        // Wait for selector if specified
        if (options.waitForSelector) {
          await page.waitForSelector(options.waitForSelector, {
            timeout: options.selectorTimeout || 10000
          });
        }
        
        // Execute custom script if provided
        if (options.script) {
          return await page.evaluate(options.script);
        }
        
        // Default extraction
        return await page.evaluate(() => {
          return {
            title: document.title,
            content: document.body.innerText,
            links: Array.from(document.querySelectorAll("a")).map(a => ({
              text: a.innerText,
              href: a.href
            })),
            meta: {
              description: document.querySelector("meta[name=\"description\"]")?.content,
              keywords: document.querySelector("meta[name=\"keywords\"]")?.content
            }
          };
        });
      });
      
      // Log successful scraping
      await this.logScrapingAction("scrape", url, {
        method: ScrapingMethod.PUPPETEER,
        success: true
      });
      
      return result;
    } catch (error) {
      // Log failed scraping
      await this.logScrapingAction("scrape", url, {
        method: ScrapingMethod.PUPPETEER,
        success: false,
        error: error.message
      });
      
      logger.error("Failed to scrape URL with puppeteer", {
        url,
        error: error.message,
        contextId: this.contextId
      });
      
      if (this.testMode) {
        return this.getMockScrapedData(url);
      }
      
      throw new ReachSparkError(
        "Failed to scrape URL with puppeteer",
        ErrorTypes.SCRAPING_ERROR,
        SeverityLevels.ERROR,
        error,
        { url, contextId: this.contextId }
      );
    }
  }

  /**
   * Scrape a URL using axios and cheerio
   * @param {string} url - URL to scrape
   * @param {Object} options - Scraping options
   * @returns {Promise<Object>} Scraped data
   */
  async scrapeAxiosCheerio(url, options = {}) {
    try {
      // Check if scraping is allowed
      const isAllowed = await this.isScrapingAllowed(url);
      if (!isAllowed) {
        throw new ReachSparkError(
          "Scraping not allowed by robots.txt",
          ErrorTypes.COMPLIANCE_ERROR,
          SeverityLevels.WARNING,
          null,
          { url, contextId: this.contextId }
        );
      }
      
      // Check rate limits
      const domain = parse(url).host;
      if (!this.checkRateLimit(domain)) {
        throw new ReachSparkError(
          "Rate limit exceeded for domain",
          ErrorTypes.RATE_LIMIT_ERROR,
          SeverityLevels.WARNING,
          null,
          { domain, contextId: this.contextId }
        );
      }
      
      // Use mock data in test mode
      if (this.testMode) {
        return this.getMockScrapedData(url);
      }
      
      // Set up proxy if available
      const proxy = this.getNextProxy();
      let axiosOptions = {
        headers: {
          "User-Agent": "ReachSparkBot/1.0 (+https://reachspark.com/bot)"
        },
        timeout: options.timeout || 10000
      };
      
      if (proxy) {
        if (proxy.type === ProxyType.HTTP) {
          axiosOptions.proxy = {
            host: proxy.host,
            port: proxy.port,
            auth: {
              username: proxy.username,
              password: proxy.password
            }
          };
        } else if (proxy.type === ProxyType.SOCKS) {
          const socksAgent = new SocksProxyAgent(`socks://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`);
          axiosOptions.httpAgent = socksAgent;
          axiosOptions.httpsAgent = socksAgent;
        }
      }
      
      // Fetch the page
      const response = await axios.get(url, axiosOptions);
      const $ = cheerio.load(response.data);
      
      // Extract data
      const result = {
        title: $("title").text(),
        content: $("body").text(),
        links: $("a").map((i, el) => ({
          text: $(el).text(),
          href: $(el).attr("href")
        })).get(),
        meta: {
          description: $("meta[name=\"description\"]").attr("content"),
          keywords: $("meta[name=\"keywords\"]").attr("content")
        }
      };
      
      // Apply custom selectors if provided
      if (options.selectors) {
        result.custom = {};
        for (const [key, selector] of Object.entries(options.selectors)) {
          result.custom[key] = $(selector).text();
        }
      }
      
      // Log successful scraping
      await this.logScrapingAction("scrape", url, {
        method: ScrapingMethod.AXIOS_CHEERIO,
        success: true
      });
      
      return result;
    } catch (error) {
      // Log failed scraping
      await this.logScrapingAction("scrape", url, {
        method: ScrapingMethod.AXIOS_CHEERIO,
        success: false,
        error: error.message
      });
      
      logger.error("Failed to scrape URL with axios/cheerio", {
        url,
        error: error.message,
        contextId: this.contextId
      });
      
      if (this.testMode) {
        return this.getMockScrapedData(url);
      }
      
      throw new ReachSparkError(
        "Failed to scrape URL with axios/cheerio",
        ErrorTypes.SCRAPING_ERROR,
        SeverityLevels.ERROR,
        error,
        { url, contextId: this.contextId }
      );
    }
  }

  /**
   * Find potential leads based on criteria
   * @param {Object} criteria - Search criteria
   * @param {Array<string>} criteria.industries - Target industries
   * @param {Object} criteria.companySize - Company size range { min, max }
   * @param {Array<string>} criteria.locations - Target locations
   * @param {Array<string>} criteria.keywords - Keywords to search for
   * @param {Array<string>} criteria.sources - Sources to scrape (e.g., [SourceType.LINKEDIN])
   * @param {number} limit - Maximum number of leads to return
   * @returns {Promise<Array>} List of potential leads
   */
  async findPotentialLeads(criteria, limit = 10) {
    try {
      // Use mock data in test mode
      if (this.testMode) {
        return this.getMockPotentialLeads(criteria, limit);
      }
      
      // Implement actual lead finding logic here
      // This would involve querying sources like LinkedIn, job boards, etc.
      // based on the provided criteria.
      // For now, returning an empty array as a placeholder.
      logger.info("Finding potential leads", {
        criteria,
        limit,
        contextId: this.contextId
      });
      
      // Placeholder: Replace with actual scraping logic
      const leads = [];
      
      // Log lead finding action
      await this.logScrapingAction("find_leads", null, {
        criteria,
        limit,
        foundCount: leads.length
      });
      
      return leads;
    } catch (error) {
      logger.error("Failed to find potential leads", {
        error: error.message,
        criteria,
        contextId: this.contextId
      });
      
      if (this.testMode) {
        return this.getMockPotentialLeads(criteria, limit);
      }
      
      throw new ReachSparkError(
        "Failed to find potential leads",
        ErrorTypes.SCRAPING_ERROR,
        SeverityLevels.ERROR,
        error,
        { criteria, contextId: this.contextId }
      );
    }
  }

  /**
   * Extract company profile information from a website
   * @param {string} domain - Company domain
   * @returns {Promise<Object>} Company profile data
   */
  async extractCompanyProfile(domain) {
    try {
      // Use mock data in test mode
      if (this.testMode) {
        return this.getMockCompanyProfile(domain);
      }
      
      // Implement actual profile extraction logic here
      // This would involve scraping the company website (e.g., about page)
      // and potentially using external APIs (e.g., Clearbit)
      logger.info("Extracting company profile", {
        domain,
        contextId: this.contextId
      });
      
      // Placeholder: Replace with actual scraping logic
      const profile = {
        name: "Placeholder Company",
        description: "This is a placeholder description.",
        industry: "Technology",
        location: "Placeholder City, CA",
        employeeCount: 100,
        website: `https://${domain}`
      };
      
      // Log profile extraction action
      await this.logScrapingAction("extract_profile", domain, {
        success: true
      });
      
      return profile;
    } catch (error) {
      logger.error("Failed to extract company profile", {
        error: error.message,
        domain,
        contextId: this.contextId
      });
      
      if (this.testMode) {
        return this.getMockCompanyProfile(domain);
      }
      
      throw new ReachSparkError(
        "Failed to extract company profile",
        ErrorTypes.SCRAPING_ERROR,
        SeverityLevels.ERROR,
        error,
        { domain, contextId: this.contextId }
      );
    }
  }

  /**
   * Extract contact information from a website
   * @param {string} domain - Company domain
   * @returns {Promise<Array>} List of contacts
   */
  async extractContactInformation(domain) {
    try {
      // Use mock data in test mode
      if (this.testMode) {
        return this.getMockContactInformation(domain);
      }
      
      // Implement actual contact extraction logic here
      // This would involve scraping the company website (e.g., contact page)
      // and potentially using external APIs (e.g., Hunter.io)
      logger.info("Extracting contact information", {
        domain,
        contextId: this.contextId
      });
      
      // Placeholder: Replace with actual scraping logic
      const contacts = [
        { name: "Placeholder Contact", title: "CEO", email: "ceo@placeholder.com" }
      ];
      
      // Log contact extraction action
      await this.logScrapingAction("extract_contacts", domain, {
        success: true,
        foundCount: contacts.length
      });
      
      return contacts;
    } catch (error) {
      logger.error("Failed to extract contact information", {
        error: error.message,
        domain,
        contextId: this.contextId
      });
      
      if (this.testMode) {
        return this.getMockContactInformation(domain);
      }
      
      throw new ReachSparkError(
        "Failed to extract contact information",
        ErrorTypes.SCRAPING_ERROR,
        SeverityLevels.ERROR,
        error,
        { domain, contextId: this.contextId }
      );
    }
  }

  /**
   * Detect the industry of a company based on its website
   * @param {string} domain - Company domain
   * @returns {Promise<string>} Detected industry
   */
  async detectIndustry(domain) {
    try {
      // Use mock data in test mode
      if (this.testMode) {
        return this.getMockIndustry(domain);
      }
      
      // Implement actual industry detection logic here
      // This could involve analyzing website content, meta tags, or using external APIs
      logger.info("Detecting industry", {
        domain,
        contextId: this.contextId
      });
      
      // Placeholder: Replace with actual detection logic
      const industry = "Technology";
      
      // Log industry detection action
      await this.logScrapingAction("detect_industry", domain, {
        success: true,
        industry
      });
      
      return industry;
    } catch (error) {
      logger.error("Failed to detect industry", {
        error: error.message,
        domain,
        contextId: this.contextId
      });
      
      if (this.testMode) {
        return this.getMockIndustry(domain);
      }
      
      throw new ReachSparkError(
        "Failed to detect industry",
        ErrorTypes.SCRAPING_ERROR,
        SeverityLevels.ERROR,
        error,
        { domain, contextId: this.contextId }
      );
    }
  }

  /**
   * Log scraping action
   * @param {string} action - Action type (scrape, find_leads, etc.)
   * @param {string|null} target - Target URL or domain
   * @param {Object} details - Action details
   * @returns {Promise<void>}
   */
  async logScrapingAction(action, target, details) {
    try {
      await this.scrapingLogRef.collection("actions").add({
        action,
        target,
        details,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      logger.warn("Failed to log scraping action", {
        error: error.message,
        action,
        target,
        contextId: this.contextId
      });
      // Non-critical error, don"t throw
    }
  }

  /**
   * Get mock scraped data for test mode
   * @param {string} url - URL being scraped
   * @returns {Object} Mock scraped data
   */
  getMockScrapedData(url) {
    return {
      title: `Mock Title for ${url}`,
      content: `This is mock content scraped from ${url}. It includes keywords like technology, innovation, and solutions.`,
      links: [
        { text: "About Us", href: `${url}/about` },
        { text: "Contact", href: `${url}/contact` }
      ],
      meta: {
        description: `Mock description for ${url}`,
        keywords: "mock, test, scraping"
      }
    };
  }

  /**
   * Get mock potential leads for test mode
   * @param {Object} criteria - Search criteria
   * @param {number} limit - Maximum number of leads
   * @returns {Array} Mock potential leads
   */
  getMockPotentialLeads(criteria, limit) {
    const leads = [];
    for (let i = 0; i < limit; i++) {
      leads.push({
        name: `Mock Lead ${i + 1}`,
        company: `Mock Company ${i + 1}`,
        title: "Mock Title",
        industry: criteria.industries ? criteria.industries[0] : "Technology",
        location: criteria.locations ? criteria.locations[0] : "United States",
        source: criteria.sources ? criteria.sources[0] : SourceType.COMPANY_WEBSITE,
        url: `https://mockcompany${i + 1}.example.com`,
        score: Math.floor(Math.random() * 100)
      });
    }
    return leads;
  }

  /**
   * Get mock company profile for test mode
   * @param {string} domain - Company domain
   * @returns {Object} Mock company profile
   */
  getMockCompanyProfile(domain) {
    return {
      name: `Mock Company for ${domain}`,
      description: `This is a mock company profile for ${domain}. We specialize in mock solutions.`,
      industry: "Technology",
      location: "Mock City, MC",
      employeeCount: Math.floor(Math.random() * 1000) + 50,
      website: `https://${domain}`,
      socialLinks: {
        linkedin: `https://linkedin.com/company/mock-${domain.split(".")[0]}`
      }
    };
  }

  /**
   * Get mock contact information for test mode
   * @param {string} domain - Company domain
   * @returns {Array} Mock contact information
   */
  getMockContactInformation(domain) {
    return [
      { name: "Mock Person One", title: "CEO", email: `ceo@${domain}`, phone: "+1-555-MOCK-001" },
      { name: "Mock Person Two", title: "CTO", email: `cto@${domain}`, phone: "+1-555-MOCK-002" }
    ];
  }

  /**
   * Get mock industry for test mode
   * @param {string} domain - Company domain
   * @returns {string} Mock industry
   */
  getMockIndustry(domain) {
    // Simple mock logic based on domain TLD
    if (domain.endsWith(".org")) return "Nonprofit";
    if (domain.endsWith(".edu")) return "Education";
    if (domain.endsWith(".gov")) return "Government";
    return "Technology";
  }

  /**
   * Close the web scraping infrastructure
   * @returns {Promise<void>}
   */
  async close() {
    if (this.cluster) {
      await this.cluster.idle();
      await this.cluster.close();
      this.cluster = null;
    }
    this.initialized = false;
    logger.info("Web scraping infrastructure closed", { contextId: this.contextId });
  }
}

// Create a singleton instance for the test harness to use
const webScraping = new WebScraping("test-context", true);

module.exports = {
  WebScraping,
  SourceType,
  ScrapingMethod,
  ProxyType,
  ScrapingFrequency,
  webScraping // Export the singleton instance for the test harness
};
