export const GATEWAY_BASE_PATH: string = process.env.ENV_GATEWAY_BASE_URL || `http://localhost:8072`;
export const CORELATE_LOGIN_PATH: string = process.env.ENV_CORELATE_LOGIN_URL || `http://localhost:3005`;

export const ACCOUNTS_BASE_PATH = `${GATEWAY_BASE_PATH}/corelate/accounts`;
export const LOGIN_ACCOUNT_API = `${ACCOUNTS_BASE_PATH}/api/p/login`;

export const ORCHESTRATOR_BASE_PATH = `${GATEWAY_BASE_PATH}/corelate/orchestrator`;
export const STUDIO_BASE_API = `${ORCHESTRATOR_BASE_PATH}/corelate/studio`;
export const STUDIO_WORKFLOW_APPLICATIONS_API = `${STUDIO_BASE_API}/workflow-applications`;

export const SESSION_APPLICATION_DATA_PATH = `${GATEWAY_BASE_PATH}/corelate/application/session-data`;
export const SESSION_DATA_FETCH_ALL_URL = `${SESSION_APPLICATION_DATA_PATH}/fetch/all`;

export const WORKFLOW_V2_BASE_PATH = `${GATEWAY_BASE_PATH}/corelate/orchestrator/v2/workflow`;
export const WORKFLOW_FETCH_BY_ID_API = `${WORKFLOW_V2_BASE_PATH}/`;
