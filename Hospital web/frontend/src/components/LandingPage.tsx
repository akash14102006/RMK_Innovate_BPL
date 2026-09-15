import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import medicalIllustration from '../assets/2737b47bf312d1c7d74e73e669d53f76a9eff7c3.png';
import logoImage from '../assets/32a5a413977d943e579cd3371923d955b6e0b7e9.png';
import welcomeImage from '../assets/bd175d8e3aacc16e79168557534c96672ce326ff.png';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'login' | 'dashboard') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* Left Section - Logo and Welcome Card */}
      <div className="absolute top-8 left-8 z-20 max-w-md">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white shadow-xl border-4 border-green-100 group-hover:border-green-300 transition-all duration-300">
              <img
                src={logoImage}
                alt="Bharat PulseLink Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-2xl text-teal-600 font-bold">Bharat PulseLink</div>
              <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">India's Shared Memory</div>
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8">
            <div className="space-y-6">
              {/* Image */}
              <div className="flex justify-center">
                <img
                  src={welcomeImage}
                  alt="Welcome"
                  className="w-64 h-auto"
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h2 className="text-3xl text-gray-900">Welcome Back</h2>
                <p className="text-gray-600">
                  Access your intelligent healthcare dashboard
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg text-lg py-7 rounded-2xl group transition-all duration-300 hover:shadow-xl"
                  onClick={() => onNavigate('login')}
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-2 border-gray-300 hover:border-teal-500 hover:bg-teal-50 text-lg py-7 rounded-2xl transition-all duration-300"
                  onClick={() => onNavigate('login')}
                >
                  Sign In
                </Button>
              </div>

              {/* Features List */}
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
                  <span>AI-Powered Predictions</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
                  <span>Real-Time Monitoring</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full"></div>
                  <span>Instant PDF Reports</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-green-200/50">
              <div className="text-2xl text-green-600">95%</div>
              <div className="text-xs text-gray-600">Accuracy</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-teal-200/50">
              <div className="text-2xl text-teal-600">500+</div>
              <div className="text-xs text-gray-600">Hospitals</div>
            </div>
            <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-blue-200/50">
              <div className="text-2xl text-blue-600">24/7</div>
              <div className="text-xs text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Background Image - Right Side */}
      <div className="absolute right-0 top-0 w-2/3 h-full flex items-center justify-center p-12">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/60"></div>
          <img
            src={medicalIllustration}
            alt="Bharat PulseLink - Hospital Intelligence"
            className="w-full h-full object-contain relative z-10"
          />
        </div>
      </div>
    </div>
  );
}

/* updated */
