'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wand2,
  Twitter,
  Youtube,
  Instagram,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    docLink: string;
    docText: string;
  }[];
}

const platforms: PlatformConfig[] = [
  {
    name: 'OpenAI',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-purple-500',
    fields: [
      {
        key: 'OPENAI_API_KEY',
        label: 'API Key',
        placeholder: 'sk-...',
        docLink: 'https://platform.openai.com/api-keys',
        docText: 'Get your API key from OpenAI',
      },
    ],
  },
  {
    name: 'Twitter',
    icon: <Twitter className="h-5 w-5" />,
    color: 'text-[#1DA1F2]',
    fields: [
      {
        key: 'TWITTER_API_KEY',
        label: 'API Key',
        placeholder: 'Your Twitter API Key',
        docLink: 'https://developer.twitter.com/en/portal/dashboard',
        docText: 'Get credentials from Twitter Developer Portal',
      },
      {
        key: 'TWITTER_API_SECRET',
        label: 'API Secret',
        placeholder: 'Your Twitter API Secret',
        docLink: 'https://developer.twitter.com/en/portal/dashboard',
        docText: 'Get credentials from Twitter Developer Portal',
      },
      {
        key: 'TWITTER_ACCESS_TOKEN',
        label: 'Access Token',
        placeholder: 'Your Access Token',
        docLink: 'https://developer.twitter.com/en/portal/dashboard',
        docText: 'Get credentials from Twitter Developer Portal',
      },
      {
        key: 'TWITTER_ACCESS_SECRET',
        label: 'Access Secret',
        placeholder: 'Your Access Secret',
        docLink: 'https://developer.twitter.com/en/portal/dashboard',
        docText: 'Get credentials from Twitter Developer Portal',
      },
    ],
  },
  {
    name: 'YouTube',
    icon: <Youtube className="h-5 w-5" />,
    color: 'text-[#FF0000]',
    fields: [
      {
        key: 'YOUTUBE_CLIENT_ID',
        label: 'Client ID',
        placeholder: 'Your YouTube Client ID',
        docLink: 'https://console.cloud.google.com/apis/credentials',
        docText: 'Get credentials from Google Cloud Console',
      },
      {
        key: 'YOUTUBE_CLIENT_SECRET',
        label: 'Client Secret',
        placeholder: 'Your YouTube Client Secret',
        docLink: 'https://console.cloud.google.com/apis/credentials',
        docText: 'Get credentials from Google Cloud Console',
      },
      {
        key: 'YOUTUBE_REDIRECT_URI',
        label: 'Redirect URI',
        placeholder: 'http://localhost:3000/api/youtube/callback',
        docLink: 'https://console.cloud.google.com/apis/credentials',
        docText: 'Configure in Google Cloud Console',
      },
    ],
  },
  {
    name: 'Instagram',
    icon: <Instagram className="h-5 w-5" />,
    color: 'text-[#f09433]',
    fields: [
      {
        key: 'INSTAGRAM_ACCESS_TOKEN',
        label: 'Access Token',
        placeholder: 'Your Instagram Access Token',
        docLink: 'https://developers.facebook.com/apps/',
        docText: 'Get token from Meta for Developers',
      },
      {
        key: 'INSTAGRAM_BUSINESS_ACCOUNT_ID',
        label: 'Business Account ID',
        placeholder: 'Your Instagram Business Account ID',
        docLink: 'https://developers.facebook.com/apps/',
        docText: 'Get ID from Meta for Developers',
      },
    ],
  },
];

export default function SetupWizardPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const currentPlatform = platforms[currentStep];
  const isLastStep = currentStep === platforms.length - 1;

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (isLastStep) {
      await handleFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleFinish = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/setup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Setup complete!', {
          description: 'Your API credentials have been saved.',
        });
        window.location.href = '/dashboard';
      } else {
        toast.error('Failed to save credentials');
      }
    } catch (error) {
      console.error('Error saving setup:', error);
      toast.error('Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="space-y-1 text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wand2 className="h-6 w-6 text-accent" />
            <h1 className="font-black text-2xl tracking-tight">Setup Wizard</h1>
          </div>
          <p className="text-xs text-secondary">
            Configure your API credentials step by step
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          {platforms.map((platform, index) => (
            <div
              key={platform.name}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                index <= currentStep ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-surface border border-border rounded-lg p-6 space-y-6 animate-slide-up">
          {/* Platform Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className={currentPlatform.color}>
              {currentPlatform.icon}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{currentPlatform.name}</h2>
              <p className="text-xs text-secondary">
                Step {currentStep + 1} of {platforms.length}
              </p>
            </div>
            {currentStep < platforms.length && (
              <span className="text-xs text-secondary">
                {currentStep + 1}/{platforms.length}
              </span>
            )}
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            {currentPlatform.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.key} className="text-sm font-medium">
                    {field.label}
                  </Label>
                  <a
                    href={field.docLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 transition-colors"
                  >
                    {field.docText}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  id={field.key}
                  type="password"
                  placeholder={field.placeholder}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="bg-background"
                />
              </div>
            ))}
          </div>

          {/* Optional Note */}
          <div className="bg-muted/30 border border-border/30 rounded-lg p-3">
            <p className="text-xs text-secondary">
              <strong>Optional:</strong> You can skip this step and add credentials later in Settings.
              Credentials are encrypted and stored securely in your database, working both locally and in production.
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0 || saving}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {!isLastStep && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={saving}
              >
                Skip
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>Saving...</>
              ) : isLastStep ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
