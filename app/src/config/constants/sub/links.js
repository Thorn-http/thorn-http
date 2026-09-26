import { CONSTANTS as GLOBAL_CONSTANTS } from "@thorn-http/core";
import { getLinkWithMetadata } from "modules/analytics/metadata";

const LINKS = {
  /** DOCS */

  // Download
  REQUESTLY_DOWNLOAD_PAGE: "https://thorn-http.dev",
  // Pricing page
  REQUESTLY_PRICING_PAGE: "https://thorn-http.dev",
  // Docs
  REQUESTLY_DOCS: "https://thorn-http.dev/docs",
  // Docs - Using Rules
  REQUESTLY_DOCS_USING_RULES: "https://thorn-http.dev/docs",
  // Docs -Sharing Rules
  REQUESTLY_DOCS_SHARING_RULES: "https://thorn-http.dev/docs",
  // Docs - File Service
  REQUESTLY_DOCS_FILES_SERVICE: "https://thorn-http.dev/docs",

  // Docs - Premium Subscription
  REQUESTLY_DOCS_PREMIUM_SUBSCRIPTION: "https://thorn-http.dev/docs",

  // Docs - Premium Subscription
  REQUESTLY_DOCS_TEAM_SUBSCRIPTION: "https://thorn-http.dev/docs",

  // Docs - Mock Server
  REQUESTLY_DOCS_MOCK_SERVER: "https://thorn-http.dev/docs",

  // Docs - Backup Data
  REQUESTLY_DOCS_BACKUP_DATA: "https://thorn-http.dev/docs",

  // Docs - Extension Troubleshooting
  REQUESTLY_EXTENSION_TROUBLESHOOTING: "https://thorn-http.dev/docs",

  REQUESTLY_EXTENSION_RULES_NOT_WORKING: "https://thorn-http.dev",

  // Docs - Mock GraphQL API response
  REQUESTLY_DOCS_MOCK_GRAPHQL: "https://thorn-http.dev/docs",

  // Docs - HTTP modifications
  REQUESTLY_DOCS_HTTP_MODIFICATIONS: "https://thorn-http.dev/docs",

  // Docs - Source Filters
  REQUESTLY_DOCS_SOURCE_FILTERS: "https://thorn-http.dev/docs",

  // Docs - Import rules from charles proxy
  REQUESTLY_DOCS_IMPORT_SETTINGS_FROM_CHARLES: "https://thorn-http.dev/docs",

  // Docs - Import Rules from resource override
  REQUESTLY_DOCS_IMPORT_SETTINGS_FROM_RESOURCE_OVERRIDE: "https://thorn-http.dev/docs",

  // Docs - Test URL condition
  REQUESTLY_DOCS_TEST_URL_CONDITION: "https://thorn-http.dev/docs",

  REQUESTLY_DOCS_SESSION_RECORDING_ARCHITECTURE: "https://thorn-http.dev/docs",

  REQUESTLY_DOCS_TEST_RULES: "https://thorn-http.dev/docs",

  REQUESTLY_API_DOCS: "https://thorn-http.dev/docs",

  REQUESTLY_REDIRECT_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_CANCEL_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_DELAY_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_HEADERS_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_QUERYPARAM_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_REPLACE_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_REQUEST_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_RESPONSE_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_SCRIPT_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_USERAGENT_RULE_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_RUNTIME_VARIABLES_DOCS: "https://thorn-http.dev/docs",

  REQUESTLY_HEADERS_RULE_FAQ_LINK: "https://thorn-http.dev/docs",

  REQUESTLY_NETWORK_INSPECTOR_DOCS: "https://thorn-http.dev/docs",

  /** API Client docs */
  REQUESTLY_API_CLIENT_DOCS: "https://thorn-http.dev/docs",

  /** API Client Import docs */
  REQUESTLY_API_CLIENT_IMPORT_POSTMAN_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_API_CLIENT_IMPORT_OPENAPI_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_API_CLIENT_IMPORT_COLLECTIONS_DOCS: "https://thorn-http.dev/docs",
  REQUESTLY_API_CLIENT_IMPORT_CURL_DOCS: "https://thorn-http.dev/docs",

  /** LANDING PAGES **/

  // Home
  REQUESTLY_LANDING_HOME: "https://thorn-http.dev",
  //Blog
  REQUESTLY_BLOG: "https://thorn-http.dev/docs",
  //Desktop App
  REQUESTLY_DESKTOP_APP: "https://thorn-http.dev",
  //Privacy Policy
  REQUESTLY_PRIVACY_POLICY: "https://thorn-http.dev/privacy",
  // Terms and Conditions
  REQUESTLY_TERMS_AND_CONDITIONS: "https://thorn-http.dev/terms",
  //Privacy Statement
  REQUESTLY_PRIVACY_STATEMENT: "https://thorn-http.dev/privacy",
  //Contact Us
  CONTACT_US: "mailto:" + GLOBAL_CONSTANTS.COMPANY_INFO.SUPPORT_EMAIL,
  // Contact Us Page
  CONTACT_US_PAGE: "https://thorn-http.dev",
  // Book A Demo
  BOOK_A_DEMO: "https://thorn-http.dev",

  /** SUPPORT */

  //Github Issues
  REQUESTLY_GITHUB_ISSUES: "https://github.com/Thorn-http/thorn-http/issues",
  FEEDBACK: "https://thorn-http.dev",

  /** EXTENSIONS */

  //Chrome
  CHROME_EXTENSION: "https://thorn-http.dev",

  CHROME_STORE_REVIEWS: "https://thorn-http.dev",
  CHROME_STORE_REVIEW_FORM: "https://thorn-http.dev",
  //Firefox
  FIREFOX_EXTENSION: "https://thorn-http.dev",
  //Edge
  EDGE_EXTENSION: "https://thorn-http.dev",
  /** GDPR */
  GDPR: {
    GDPR_PAGE: "https://thorn-http.dev/privacy",
    EXPORT_DATA: "https://thorn-http.dev",
    DELETE_ACCOUNT: "https://thorn-http.dev",
    SIGN_DPA: "https://thorn-http.dev",
  },

  /** TUTORIALS */
  YOUTUBE_TUTORIALS: "https://thorn-http.dev",
  YOUTUBE_API_CLIENT_TUTORIALS: "https://thorn-http.dev",

  TUTORIALS: {
    REDIRECT_RULE: "https://thorn-http.dev",
  },

  DEMO_VIDEOS: {
    TEAM_WORKSPACES: "https://thorn-http.dev",
  },

  DOWNLOAD_DESKTOP_APP: {
    MACOS: "https://thorn-http.dev",
    WINDOWS: "https://thorn-http.dev",
    LINUX: "https://thorn-http.dev",
  },

  CHANGELOG: "https://thorn-http.dev",
  PRODUCTLIFT_CHANGELOG: "https://thorn-http.dev",

  ACCELERATOR_PROGRAM_FORM_LINK: "https://thorn-http.dev",

  GITHUB_STUDENT_PROGRAM_DOC: "https://thorn-http.dev",

  GITHUB_EDUCATION_PACK_LP: "https://github.com/Thorn-http/thorn-http",

  API_CLIENT_LOCAL_FIRST_ANNOUNCEMENT: "https://thorn-http.dev",

  REQUESTLY_GITHUB: "https://github.com/Thorn-http/thorn-http",

  OAUTH_REDIRECT_URL: `${process.env.VITE_BACKEND_BASE_URL}/oauth/authorize`,

  ACQUISITION_DETAILS: "https://thorn-http.dev",

  API_KEY_FORM: "https://thorn-http.dev",

  AUTOMATION_DOC: "https://thorn-http.dev",

  DOWNLOAD_CRX: "https://thorn-http.dev",

  DOWNLOAD_CHROME_EXTENSION_ZIP: "https://thorn-http.dev",

  SHARE_ON_LINKEDIN_FORM: "https://thorn-http.dev",

  NOTION_PAGE_FOR_PROMOTION: "https://thorn-http.dev",

  AI_DOC_LINK: "https://thorn-http.dev/docs",

  REQUESTLY_SECRETS_DOCS: "https://thorn-http.dev/docs",
};

export default LINKS;
