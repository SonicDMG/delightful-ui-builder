
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { toast } from '@/components/ui/use-toast';

interface CodeBeast {
  username: string;
  imageUrl: string;
}

const Gallery = () => {
  const [codeBeasts, setCodeBeasts] = useState<CodeBeast[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCodeBeasts = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/static/temp`);
      const data = await response.json();
      setCodeBeasts(data);
    } catch {
      // Fallback data in case the API isn't available
      const fallbackData: CodeBeast[] = [
        { username: 'example-user', imageUrl: '/static/temp/generated_example-user.png' },
      ];
      setCodeBeasts(fallbackData);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCodeBeasts();
  }, []);

  const handleDownload = async (imageUrl: string, username: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${imageUrl}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `codebeast-${username}.png`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast({
        description: "CodeBeast downloaded successfully!",
        duration: 2000,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to download CodeBeast.",
        duration: 2000,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="text-4xl font-bold text-white">CodeBeasts Gallery</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchCodeBeasts}
            disabled={isRefreshing}
            className="text-white/60 hover:text-white"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-white/80 text-2xl font-medium">Don't have a CodeBeast yet?</p>
          <Link to="/">
            <Button 
              variant="outline" 
              className="bg-black/20 border-white/10 hover:border-white/20 hover:bg-black/30 text-white gap-2 text-lg font-semibold"
            >
              <Sparkles className="w-5 h-5" />
              Generate Your Own Now!
            </Button>
          </Link>
        </div>
      </div>

      {codeBeasts.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 auto-rows-fr">
          {codeBeasts.map((beast) => (
            <div key={beast.username} className="group relative aspect-[1/1.2]">
              <Card className="h-full overflow-hidden bg-black/20 border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="h-full p-2 flex flex-col">
                  <div className="relative flex-1">
                    {/* Desktop-only download button (hidden on mobile) */}
                    <button
                      onClick={() => handleDownload(beast.imageUrl, beast.username)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/90 hidden md:block"
                      title="Download CodeBeast"
                    >
                      <Download className="w-4 h-4 text-white" />
                    </button>

                    <div className="aspect-square overflow-hidden rounded-lg">
                      <img
                        src={`${API_BASE_URL}${beast.imageUrl}`}
                        alt={`CodeBeast for ${beast.username}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-white/80 text-center text-sm font-medium truncate">@{beast.username}</p>
                    
                    {/* Mobile-only action buttons */}
                    <div className="flex justify-center gap-2 mt-2 md:hidden">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleDownload(beast.imageUrl, beast.username)}
                        className="glass h-8 w-8"
                        title="Download CodeBeast"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="glass h-8 w-8"
                        asChild
                      >
                        <a
                          href={`https://github.com/${beast.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View GitHub Profile"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Desktop-only GitHub link wrapper */}
              <a 
                href={`https://github.com/${beast.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 hidden md:block hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-white/60 py-12">
          <p className="text-lg mb-4">No CodeBeasts have been generated yet.</p>
          <p className="text-sm mb-6">Be the first to create your unique AI-generated creature!</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Generate Your CodeBeast
          </Link>
        </div>
      )}
    </div>
  );
};

export default Gallery;
