import { json, optionsResponse } from '@/lib/http';
import { getResolvedPlatformSettings } from '@/lib/platform-settings';

export async function OPTIONS() {
  return optionsResponse();
}

export async function GET() {
  const settings = await getResolvedPlatformSettings();
  return json({
    success: true,
    data: {
      enabled: Boolean(
        settings.oidcEnabled && settings.oidcIssuer && settings.oidcClientId,
      ),
      buttonLabel: settings.oidcButtonLabel || '',
    },
  });
}
