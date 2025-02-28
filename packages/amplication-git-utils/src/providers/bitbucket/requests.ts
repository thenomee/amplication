import fetch from "node-fetch";
import { CustomError } from "../../utils/custom-error";
import {
  Account,
  OAuth2,
  PaginatedRepositories,
  PaginatedWorkspaceMembership,
  Repository,
} from "./bitbucket.types";

enum GrantType {
  RefreshToken = "refresh_token",
  AuthorizationCode = "authorization_code",
}

interface RequestPayload {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

const AUTHORIZE_URL = "https://bitbucket.org/site/oauth2/authorize";
const ACCESS_TOKEN_URL = "https://bitbucket.org/site/oauth2/access_token";
const CURRENT_USER_URL = "https://api.bitbucket.org/2.0/user";
const CURRENT_USER_WORKSPACES_URL =
  "https://api.bitbucket.org/2.0/user/permissions/workspaces";

const REPOSITORIES_IN_WORKSPACE_URL = (workspaceSlug: string) =>
  `https://api.bitbucket.org/2.0/repositories/${workspaceSlug}`;

const REPOSITORY_URL = (workspaceSlug: string, repositorySlug: string) =>
  `https://api.bitbucket.org/2.0/repositories/${workspaceSlug}/${repositorySlug}`;

const REPOSITORY_CREATE_URL = (workspaceSlug: string, repositorySlug: string) =>
  `https://api.bitbucket.org/2.0/repositories/${workspaceSlug}/${repositorySlug}`;

const getAuthHeaders = (clientId: string, clientSecret: string) => ({
  "Content-Type": "application/x-www-form-urlencoded",
  Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  )}`,
});

const getRequestHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  Accept: "application/json",
});

async function requestWrapper(url: string, payload: RequestPayload) {
  try {
    const response = await fetch(url, payload);
    return response.json();
  } catch (error) {
    const errorBody = await error.response.text();
    throw new CustomError(errorBody);
  }
}

export async function authorizeRequest(
  clientId: string,
  amplicationWorkspaceId: string
) {
  const callbackUrl = `${AUTHORIZE_URL}?client_id=${clientId}&response_type=code&state={state}`;
  return callbackUrl.replace("{state}", amplicationWorkspaceId);
}

export async function refreshTokenRequest(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<OAuth2> {
  return requestWrapper(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: getAuthHeaders(clientId, clientSecret),
    body: `grant_type=${GrantType.RefreshToken}&refresh_token=${refreshToken}`,
  });
}

export async function authDataRequest(
  clientId: string,
  clientSecret: string,
  code: string
): Promise<OAuth2> {
  return requestWrapper(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: getAuthHeaders(clientId, clientSecret),
    body: `grant_type=${GrantType.AuthorizationCode}&code=${code}`,
  });
}

export async function currentUserRequest(
  accessToken: string
): Promise<Account> {
  return requestWrapper(CURRENT_USER_URL, {
    method: "GET",
    headers: getRequestHeaders(accessToken),
  });
}

export async function currentUserWorkspacesRequest(
  accessToken: string
): Promise<PaginatedWorkspaceMembership> {
  return requestWrapper(CURRENT_USER_WORKSPACES_URL, {
    method: "GET",
    headers: getRequestHeaders(accessToken),
  });
}

export async function repositoriesInWorkspaceRequest(
  workspaceSlug: string,
  accessToken: string
): Promise<PaginatedRepositories> {
  return requestWrapper(REPOSITORIES_IN_WORKSPACE_URL(workspaceSlug), {
    method: "GET",
    headers: getRequestHeaders(accessToken),
  });
}

export async function repositoryRequest(
  workspaceSlug: string,
  repositorySlug: string,
  accessToken: string
): Promise<Repository> {
  return requestWrapper(REPOSITORY_URL(workspaceSlug, repositorySlug), {
    method: "GET",
    headers: getRequestHeaders(accessToken),
  });
}

export async function repositoryCreateRequest(
  workspaceSlug: string,
  repositorySlug: string,
  repositoryCreateData: Partial<Repository>,
  accessToken: string
): Promise<Repository> {
  return requestWrapper(REPOSITORY_CREATE_URL(workspaceSlug, repositorySlug), {
    method: "POST",
    headers: {
      ...getRequestHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(repositoryCreateData),
  });
}
