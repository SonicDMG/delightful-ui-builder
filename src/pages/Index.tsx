
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { HandleInput } from '@/components/github/HandleInput';
import { RepositoryInfo } from '@/components/github/RepositoryInfo';
import { GeneratedImage } from '@/components/github/GeneratedImage';
import { ModelSelector } from '@/components/github/ModelSelector';
import type { ProcessResponse, GenerateImageResponse } from '@/types/github';

const Index = () => {
  const [handle, setHandle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [repoCount, setRepoCount] = useState<number>(0);
  const [githubUrl, setGithubUrl] = useState('');
  const [animalSelection, setAnimalSelection] = useState<[string, string][]>([]);
  const [isFading, setIsFading] = useState(false);
  const [model, setModel] = useState('stability');
  const { toast } = useToast();

  const resetState = () => {
    setGeneratedImage('');
    setLanguages([]);
    setGeneratedPrompt('');
    setRepoCount(0);
    setGithubUrl('');
    setAnimalSelection([]);
    setIsFading(false);
  };

  const updateLoadingStatus = (status: string, progress: number) => {
    NProgress.configure({ showSpinner: false });
    NProgress.set(progress);
    toast({
      title: status,
      description: "Please wait while we process your request...",
    });
  };

  const handleGenerate = async () => {
    if (!handle) {
      toast({
        title: "Please enter a GitHub handle",
        variant: "destructive",
      });
      return;
    }

    if (generatedImage) {
      setIsFading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      resetState();
    }

    setIsGenerating(true);
    NProgress.start();

    try {
      updateLoadingStatus(`Analyzing GitHub profile...`, 0.1);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      updateLoadingStatus('Collecting repository data...', 0.2);
      await new Promise(resolve => setTimeout(resolve, 800));

      const processResponse = await fetch('http://localhost:5000/chat/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: handle }),
      });

      if (!processResponse.ok) {
        throw new Error('Processing failed');
      }

      const processData: ProcessResponse = await processResponse.json();
      
      if (processData.status === 'error') {
        throw new Error(processData.error || 'Processing failed');
      }

      setLanguages(processData.languages);
      setGeneratedPrompt(processData.response);
      setRepoCount(processData.num_repositories);
      setGithubUrl(processData.github_url);
      setAnimalSelection(processData.animal_selection);
      
      updateLoadingStatus('Generating AI response...', 0.3);
      await new Promise(resolve => setTimeout(resolve, 800));

      updateLoadingStatus(`Creating your CodeBeast with ${model === 'dall_e' ? 'DALL-E' : 'Stability'} API...`, 0.7);
      const generateResponse = await fetch('http://localhost:5000/chat/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: processData.response,
          model: model,
          handle: handle
        }),
      });

      if (!generateResponse.ok) {
        throw new Error('Image generation failed');
      }

      const generateData: GenerateImageResponse = await generateResponse.json();
      
      if (generateData.status === 'error') {
        throw new Error(generateData.error || 'Image generation failed');
      }

      setGeneratedImage(`http://localhost:5000/${generateData.image_url}`);
      
      NProgress.done();
      toast({
        title: "CodeBeast generation complete!",
        description: "Your unique beast has been created.",
      });
    } catch (error) {
      NProgress.done();
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
      resetState();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGenerate();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codebeast-${handle}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your CodeBeast image is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading your image.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    const text = `Check out my unique CodeBeast! 🎮✨ Generated using my GitHub profile stats!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    
    toast({
      title: "Sharing to X",
      description: "Opening X (formerly Twitter) to share your CodeBeast.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col px-4">
      <div className="w-full flex justify-center py-8">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <img 
            src="/lovable-uploads/6e48cfe8-7c75-4565-939d-f665321ddd3a.png" 
            alt="CodeBeasts"
            className="relative w-[300px] h-auto drop-shadow-[0_0_15px_rgba(155,135,245,0.3)] transition-all duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center">
        <Card className="glass w-full max-w-4xl p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <HandleInput
                handle={handle}
                isGenerating={isGenerating}
                onHandleChange={setHandle}
                onGenerate={handleGenerate}
                onKeyPress={handleKeyPress}
              />
              
              <ModelSelector
                model={model}
                onModelChange={setModel}
                disabled={isGenerating}
              />
              
              <RepositoryInfo
                repoCount={repoCount}
                languages={languages}
                prompt={generatedPrompt}
                githubUrl={githubUrl}
                animalSelection={animalSelection}
              />
            </div>

            {generatedImage && (
              <GeneratedImage
                imageUrl={generatedImage}
                handle={handle}
                onDownload={handleDownload}
                onShare={handleShare}
                className={isFading ? 'animate-fade-out' : 'animate-fade-in'}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
