import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function GoogleMapsSetupGuide() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-4">
      <Card className="border-yellow-300 bg-yellow-50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <CardTitle className="text-lg text-gray-900">Google Maps API Configuration Required</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                To enable the real-time disease heat map, you need to configure Google Maps API in Google Cloud Console.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="text-gray-900 mb-2">Go to Google Cloud Console</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Open the Google Cloud Console and navigate to the APIs & Services section.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://console.cloud.google.com/google/maps-apis/credentials', '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Google Cloud Console
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="text-gray-900 mb-2">Enable Required APIs</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Make sure the following APIs are enabled in your Google Cloud project:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">Maps JavaScript API</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">Maps SDK for Android (optional for mobile)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">Places API (optional for location search)</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://console.cloud.google.com/apis/library/maps-backend.googleapis.com', '_blank')}
                  className="gap-2 mt-3"
                >
                  <ExternalLink className="w-4 h-4" />
                  Enable APIs
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="text-gray-900 mb-2">Configure API Key Restrictions</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Click on your API key and add the following HTTP referrer to allow requests from Figma:
                </p>
                <div className="bg-gray-50 rounded p-3 mb-3 border border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm text-gray-900 break-all">
                      https://*.figma.site/*
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('https://*.figma.site/*')}
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  This wildcard pattern allows the API to work on all Figma preview domains.
                </p>
                
                <div className="bg-blue-50 rounded p-3 border border-blue-200">
                  <p className="text-xs text-blue-800 mb-2">
                    <strong>For local development:</strong> Also add:
                  </p>
                  <div className="bg-white rounded p-2 border border-blue-200 mb-2">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs text-gray-900">http://localhost:*</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('http://localhost:*')}
                        className="flex-shrink-0 h-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-sm">
                4
              </div>
              <div className="flex-1">
                <h4 className="text-gray-900 mb-2">Copy Your API Key</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Copy your Google Maps API key from the credentials page and configure it in the Settings page.
                </p>
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">API Key Configuration:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-gray-600">
                      Configure your API key in Settings → API Configuration
                    </code>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  You can update this in the Settings page → API Configuration section.
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full text-white flex items-center justify-center flex-shrink-0 text-sm">
                5
              </div>
              <div className="flex-1">
                <h4 className="text-gray-900 mb-2">Save and Test</h4>
                <p className="text-sm text-gray-600 mb-3">
                  After configuring the restrictions, save your changes and refresh this page to test the map.
                </p>
                <Button
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Refresh Page After Setup
                </Button>
              </div>
            </div>
          </div>

          {/* Alternative Option */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <h4 className="text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              Alternative: Use Unrestricted API Key (Development Only)
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              For quick testing, you can create a new API key without HTTP referrer restrictions. However, this is NOT recommended for production use.
            </p>
            <div className="bg-white rounded p-3 border border-purple-200">
              <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                <li>Create a new API key in Google Cloud Console</li>
                <li>Under "Application restrictions", select "None"</li>
                <li>Under "API restrictions", select "Restrict key" and choose "Maps JavaScript API"</li>
                <li>Save and use this key for testing</li>
                <li>⚠️ Add restrictions before deploying to production</li>
              </ol>
            </div>
          </div>

          {/* Help Resources */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-gray-900 mb-3 text-sm">Additional Resources:</h4>
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://developers.google.com/maps/documentation/javascript/get-api-key', '_blank')}
                className="w-full justify-start gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Google Maps API Key Documentation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://developers.google.com/maps/documentation/javascript/error-messages', '_blank')}
                className="w-full justify-start gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Error Messages Reference
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open('https://console.cloud.google.com/billing', '_blank')}
                className="w-full justify-start gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Enable Billing (Required for Maps API)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
/* updated */
