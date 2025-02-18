import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Download, Share2, GitFork } from 'lucide-react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

interface ProcessResponse {
  response: string;
  languages: string[];
  github_url: string;
  num_repositories: number;
  status: 'success' | 'error';
  error?: string;
}

interface GenerateImageResponse {
  image_url: string;
  status: 'success' | 'error';
  error?: string;
}

const Index = () => {
  const [handle, setHandle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [repoCount, setRepoCount] = useState<number>(0);
  const { toast } = useToast();

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

    setIsGenerating(true);
    NProgress.start();

    try {
      updateLoadingStatus('Analyzing GitHub profile...', 0.1);
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
      
      updateLoadingStatus('Generating AI response...', 0.6);
      await new Promise(resolve => setTimeout(resolve, 800));

      updateLoadingStatus('Creating your CodeBeast with Dall-E...', 0.7);
      const generateResponse = await fetch('http://localhost:5000/chat/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: processData.response }),
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
      console.error('Generation error:', error);
      NProgress.done();
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-4">
      <div className="w-full flex justify-center py-4">
        <img 
          src="/lovable-uploads/6e48cfe8-7c75-4565-939d-f665321ddd3a.png" 
          alt="CodeBeasts"
          className="w-[200px] h-auto"
        />
      </div>

      <div className="flex-1 flex flex-col items-center space-y-6 py-4">
        <Card className="glass w-full max-w-4xl p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Input
                placeholder="Enter GitHub handle to generate your beast..."
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="bg-black/40 border-white/20 text-white placeholder:text-white/50"
              />
              
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>

              {repoCount > 0 && (
                <div className="flex items-center gap-2 text-white/60">
                  <GitFork className="h-4 w-4" />
                  <span>{repoCount} repositories</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {languages.map((tech) => (
                  <span key={tech} className="px-3 py-1 rounded-full glass text-sm text-white/60">
                    {tech}
                  </span>
                ))}
              </div>

              {generatedPrompt && (
                <div className="mt-4 p-4 rounded-lg bg-black/20 border border-white/10">
                  <p className="text-white/80 text-sm leading-relaxed">
                    {generatedPrompt}
                  </p>
                </div>
              )}
            </div>

            {generatedImage && (
              <div className="lg:w-[600px] space-y-4 animate-fade-in">
                <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                  <img
                    src={generatedImage}
                    alt="Generated CodeBeast"
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="flex gap-4 justify-center">
                  <Button variant="secondary" className="glass">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="secondary" className="glass">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
