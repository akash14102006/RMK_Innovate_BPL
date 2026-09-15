import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Key, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { apiSetupService } from '../services/apiSetupService';

interface ApiSetupRequiredProps {
    onNavigateToSettings: () => void;
}

export default function ApiSetupRequired({ onNavigateToSettings }: ApiSetupRequiredProps) {
    const status = apiSetupService.checkSetupStatus();
    const progress = apiSetupService.getConfigurationProgress();

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
            <Card className="w-full max-w-2xl shadow-2xl border-2 border-teal-200">
                <CardHeader className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Key className="w-10 h-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl text-gray-900">API Configuration Required</CardTitle>
                    <p className="text-gray-600 mt-2">
                        To unlock real-time data and enable all dashboard features, please configure your API keys.
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Configuration Progress</span>
                            <span className="font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-teal-500 to-blue-600 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Required APIs List */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-gray-900 font-semibold mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            Required API Keys ({status.missingKeys.length} remaining)
                        </h3>
                        <div className="space-y-2">
                            {status.requiredKeys.map((keyName, index) => {
                                const isConfigured = status.configuredKeys.includes(keyName);
                                return (
                                    <div key={index} className="flex items-center gap-2">
                                        {isConfigured ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                                        )}
                                        <span className={isConfigured ? 'text-green-700 line-through' : 'text-gray-700'}>
                                            {keyName}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Why APIs are needed */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Why are API keys needed?</h4>
                        <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                            <li><strong>Pollution Monitor</strong> - Real-time air quality data for 100+ Indian cities</li>
                            <li><strong>Festival Calendar</strong> - Accurate festival dates and health impact predictions</li>
                            <li><strong>Epidemic Tracker</strong> - Live disease outbreak alerts and case counts</li>
                            <li><strong>Weather Integration</strong> - Temperature, humidity for patient load forecasting</li>
                            <li><strong>Disease Maps</strong> - Interactive outbreak visualization on Google Maps</li>
                        </ul>
                    </div>

                    {/* Call to Action */}
                    <div className="flex gap-3">
                        <Button
                            onClick={onNavigateToSettings}
                            className="flex-1 h-12 bg-gradient-to-r from-teal-600 to-blue-700 hover:from-teal-700 hover:to-blue-800 text-white text-lg"
                        >
                            Configure API Keys Now
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </div>

                    {/* Helper Text */}
                    <p className="text-xs text-gray-500 text-center">
                        All API keys are <strong>FREE</strong> to obtain and take less than 5 minutes to set up.
                        Your keys are stored securely and privately in your account.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

/* updated */
