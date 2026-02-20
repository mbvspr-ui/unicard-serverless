import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { X, UserPlus, Users, Package, CheckCircle2 } from 'lucide-react';

export default function WelcomeGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has seen the guide
    const hasSeenGuide = localStorage.getItem('has_seen_welcome_guide');
    if (!hasSeenGuide) {
      // Show guide after a short delay
      setTimeout(() => setShowGuide(true), 1000);
    }
  }, []);

  const steps = [
    {
      icon: UserPlus,
      title: 'Welcome to Samiul Graphics!',
      description: 'Let\'s get you started with creating ID cards for your school. This quick guide will show you the basics.',
      action: 'Get Started',
    },
    {
      icon: Users,
      title: 'Step 1: Add Students & Staff',
      description: 'Start by adding your students and staff members. You can add them one by one or import in bulk. Don\'t forget to upload photos!',
      action: 'Add Students',
      actionPath: '/students/add',
    },
    {
      icon: Package,
      title: 'Step 2: Submit Batch Order',
      description: 'Once you\'ve added everyone, select the people you want ID cards for and submit a batch order. We\'ll process it quickly!',
      action: 'View Submissions',
      actionPath: '/submissions',
    },
    {
      icon: CheckCircle2,
      title: 'You\'re All Set!',
      description: 'That\'s it! You can always access help by clicking the blue help button at the bottom right. Happy creating!',
      action: 'Start Using App',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleAction = () => {
    const step = steps[currentStep];
    if (step.actionPath) {
      navigate(step.actionPath);
    }
    handleClose();
  };

  const handleClose = () => {
    localStorage.setItem('has_seen_welcome_guide', 'true');
    setShowGuide(false);
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!showGuide) {
    return null;
  }

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 relative animate-in zoom-in-95">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close guide"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon className="w-10 h-10 text-blue-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{step.description}</p>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-blue-600'
                    : index < currentStep
                    ? 'w-2 bg-blue-400'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step.actionPath ? (
              <Button onClick={handleAction} className="flex-1">
                {step.action}
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1">
                {currentStep === steps.length - 1 ? step.action : 'Next'}
              </Button>
            )}
          </div>

          {currentStep < steps.length - 1 && (
            <button
              onClick={handleSkip}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip tutorial
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
