// src/utils/oauth.ts

export type OAuthUserInfo = {
  providerAccountId: string;
  email: string;
  name: string;
  avatar: string;
};

export type OAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
};

// ─── Base interface semua provider harus implement ───────────────────────────
export interface IOAuthProvider {
  getAuthURL(state: string): string;
  exchangeCode(code: string): Promise<OAuthTokens>;
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}

// ─── Google ───────────────────────────────────────────────────────────────────
export class GoogleOAuthProvider implements IOAuthProvider {
  private readonly AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  private readonly TOKEN_URL = "https://oauth2.googleapis.com/token";
  private readonly USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string,
  ) {}

  getAuthURL(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `${this.AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const res = await fetch(this.TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!res.ok) throw new Error(`[Google] Failed to exchange code: ${await res.text()}`);

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const res = await fetch(this.USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error(`[Google] Failed to fetch user info: ${await res.text()}`);

    const data = await res.json();

    if (!data.email) throw new Error("[Google] Email not provided");

    return {
      providerAccountId: data.sub,
      email: data.email,
      name: data.name,
      avatar: data.picture ?? "",
    };
  }
}

// ─── GitHub ───────────────────────────────────────────────────────────────────
export class GitHubOAuthProvider implements IOAuthProvider {
  private readonly AUTH_URL = "https://github.com/login/oauth/authorize";
  private readonly TOKEN_URL = "https://github.com/login/oauth/access_token";
  private readonly USERINFO_URL = "https://api.github.com/user";
  private readonly EMAIL_URL = "https://api.github.com/user/emails";

  constructor(
    private clientId: string,
    private clientSecret: string,
    private redirectUri: string,
  ) {}

  getAuthURL(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: "read:user user:email",
      state,
    });
    return `${this.AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthTokens> {
    const res = await fetch(this.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!res.ok) throw new Error(`[GitHub] Failed to exchange code: ${await res.text()}`);

    const data = await res.json();
    return {
      accessToken: data.access_token,
      // GitHub tidak issue refresh token untuk OAuth Apps
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    };

    const [userRes, emailsRes] = await Promise.all([fetch(this.USERINFO_URL, { headers }), fetch(this.EMAIL_URL, { headers })]);

    if (!userRes.ok) throw new Error(`[GitHub] Failed to fetch user info: ${await userRes.text()}`);

    const user = await userRes.json();
    const emails: { email: string; primary: boolean; verified: boolean }[] = emailsRes.ok ? await emailsRes.json() : [];

    // Ambil email primary & verified, fallback ke email di profile
    const primaryEmail = emails.find((e) => e.primary && e.verified)?.email ?? user.email ?? "";

    if (!primaryEmail) throw new Error("[GitHub] Email not provided or not verified");

    return {
      providerAccountId: String(user.id),
      email: primaryEmail,
      name: user.name || user.login,
      avatar: user.avatar_url ?? "",
    };
  }
}
