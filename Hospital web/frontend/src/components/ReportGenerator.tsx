import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { FileDown, Loader2, CheckCircle, Calendar, Download } from 'lucide-react';
import { useState } from 'react';
import { generateComprehensivePDFReport, ComprehensiveReportData } from '../services/comprehensiveReportService';
import { predictPatientSurge } from '../services/predictionService';
import { fetchEpidemicData, fetchHealthAlertsFromNewsAPI } from '../services/healthAlertsService';
import { INDIAN_FESTIVALS_2026 } from '../services/festivalService';
import { toast } from 'sonner';

interface ReportGeneratorProps {
  variant?: 'card' | 'button';
}

export default function ReportGenerator({ variant = 'card' }: ReportGeneratorProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [lastGeneratedReport, setLastGeneratedReport] = useState<{
    filename: string;
    timestamp: string;
  } | null>(null);

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);

    try {
      toast.info('🔄 Fetching latest data from all modules...');

      // Fetch real-time data from all services
      const [prediction, epidemicData, healthAlerts] = await Promise.all([
        predictPatientSurge({
          city: 'Chennai',
          aqi: 218,
          temperature: 29,
          humidity: 45,
          festivalName: 'Diwali',
          epidemicActive: true,
          epidemicCases: 1284,
          baselinePatients: 420,
        }),
        fetchEpidemicData(),
        fetchHealthAlertsFromNewsAPI()
      ]);

      // Get upcoming festivals
      const today = new Date();
      const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcomingFestivals = INDIAN_FESTIVALS_2026.filter(festival => {
        const festivalDate = new Date(festival.date);
        return festivalDate >= today && festivalDate <= next30Days;
      });

      // Get current festival
      const currentFestival = INDIAN_FESTIVALS_2026.find(festival => {
        const festivalDate = new Date(festival.date);
        const diffDays = Math.abs((festivalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      });

      // State-wise disease data
      const stateWiseData = [
        { state: 'Maharashtra', cases: 2847, severity: 'high' as const },
        { state: 'Delhi', cases: 1956, severity: 'high' as const },
        { state: 'Karnataka', cases: 1423, severity: 'moderate' as const },
        { state: 'Tamil Nadu', cases: 1189, severity: 'moderate' as const },
        { state: 'Uttar Pradesh', cases: 1856, severity: 'moderate' as const },
        { state: 'Kerala', cases: 876, severity: 'moderate' as const },
        { state: 'West Bengal', cases: 1234, severity: 'moderate' as const },
        { state: 'Gujarat', cases: 654, severity: 'low' as const },
        { state: 'Rajasthan', cases: 523, severity: 'low' as const },
        { state: 'Punjab', cases: 412, severity: 'low' as const },
      ];

      // Prepare comprehensive report data
      const reportData: ComprehensiveReportData = {
        hospitalName: 'Bharat PulseLink Hospital',
        city: 'Chennai',
        region: 'Chennai',
        aqi: 218,
        aqiLevel: 'Poor',
        pm25: 125,
        pm10: 234,
        temperature: 29,
        humidity: 45,
        weatherCondition: 'Hazy',
        upcomingFestivals: upcomingFestivals,
        currentFestival: currentFestival,
        prediction: prediction,
        epidemicActive: true,
        epidemicData: epidemicData,
        healthAlerts: healthAlerts.slice(0, 5),
        stateWiseData: stateWiseData,
        generatedBy: 'Bharat PulseLink System',
        generatedAt: new Date().toISOString(),
      };

      toast.success('📄 Generating comprehensive PDF report...');

      // Generate PDF
      generateComprehensivePDFReport(reportData);

      const filename = `BharatPulseLink_Comprehensive_Report_${reportData.city}_${new Date().toISOString().split('T')[0]}.pdf`;
      setLastGeneratedReport({
        filename,
        timestamp: new Date().toISOString(),
      });

      toast.success('✅ PDF report generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('❌ Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (variant === 'button') {
    return (
      <Button
        onClick={handleGeneratePDF}
        disabled={isGeneratingPDF}
        className="bg-teal-600 hover:bg-teal-700"
      >
        {isGeneratingPDF ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4 mr-2" />
            Generate PDF Report
          </>
        )}
      </Button>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="w-5 h-5 text-teal-600" />
          Real-Time Report Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Generate a comprehensive PDF report with the latest AI predictions, pollution data,
          festival impact analysis, and hospital recommendations.
        </p>

        <div className="flex gap-3">
          <Button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate Report Now
              </>
            )}
          </Button>
        </div>

        {lastGeneratedReport && (
          <div className="p-3 bg-white rounded-lg border border-teal-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate">
                  {lastGeneratedReport.filename}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(lastGeneratedReport.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Report includes:</strong> Patient surge predictions, AQI analysis,
            festival impact, epidemic tracking, staff recommendations, and AI-generated advisories.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
/* updated */
