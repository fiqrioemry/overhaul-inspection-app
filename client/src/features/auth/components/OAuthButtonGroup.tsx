// src/features/auth/components/OAuthButtonGroup.tsx

import OAuthButton from "./OAuthButton";
import { OAUTH_PROVIDER_CONFIG, type OAuthProviderKey } from "@/constants/auth.constant";

interface OAuthButtonGroupProps {
  disabled?: boolean;
  providers?: OAuthProviderKey[];
}

export default function OAuthButtonGroup({ disabled, providers }: OAuthButtonGroupProps) {
  const entries = providers ? providers.map((key) => [key, OAUTH_PROVIDER_CONFIG[key]] as const) : (Object.entries(OAUTH_PROVIDER_CONFIG) as [OAuthProviderKey, (typeof OAUTH_PROVIDER_CONFIG)[OAuthProviderKey]][]);

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, config]) => (
        <OAuthButton key={key} provider={key} label={config.label} icon={config.icon} disabled={disabled} />
      ))}
    </div>
  );
}
