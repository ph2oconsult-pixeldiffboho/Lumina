/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query } from 'firebase/firestore';
import { auth, db, signIn, logOut } from './lib/firebase';
import { INITIAL_MODULES } from './constants';
import { Module, UserProfile, Progress } from './types';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Map as MapIcon, 
  User as UserIcon, 
  ChevronRight, 
  Heart, 
  Star, 
  Compass,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  Play,
  Square,
  BarChart2,
  Mountain,
  CloudLightning,
  Smartphone,
  Shield,
  Key,
  Flame,
  Anchor,
  Lock
} from 'lucide-react';
import Markdown from 'react-markdown';
import { generateModuleContent, generateAudio } from './lib/gemini';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

// --- Icon Map ---
const IconMap: Record<string, React.ElementType> = {
  Mountain,
  CloudLightning,
  Smartphone,
  Compass,
  Shield,
  Key,
  Flame,
  Anchor,
  Star
};

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  type = 'button',
  disabled,
  size = 'md'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent'
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-full font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component 
      onClick={onClick} 
      className={cn('bg-card rounded-3xl p-8 border border-white/10 text-left w-full transition-all duration-300', className)}
    >
      {children}
    </Component>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [view, setView] = useState<'library' | 'module' | 'profile' | 'situation-room' | 'analytics'>('library');
  const [userProgress, setUserProgress] = useState<Record<string, Progress>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [situationTopic, setSituationTopic] = useState('');
  
  // Audio State
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // Reflection State
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');

  // Family Sync State
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch or create profile
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        
        let currentProfile: UserProfile;
        let activeFamilyId = u.uid;

        if (userSnap.exists()) {
          const userData = userSnap.data() as UserProfile;
          if (userData.linkedFamilyId) {
            activeFamilyId = userData.linkedFamilyId;
            const familySnap = await getDoc(doc(db, 'users', activeFamilyId));
            if (familySnap.exists()) {
              currentProfile = familySnap.data() as UserProfile;
            } else {
              currentProfile = userData; // Fallback
            }
          } else {
            currentProfile = userData;
          }
        } else {
          currentProfile = {
            uid: u.uid,
            email: u.email || '',
            completedModules: []
          };
          await setDoc(userRef, currentProfile);
        }

        setProfile(currentProfile);
        setFamilyId(activeFamilyId);

        // Listen for progress
        const progressQuery = query(collection(db, 'users', activeFamilyId, 'progress'));
        onSnapshot(progressQuery, (snapshot) => {
          const progressMap: Record<string, Progress> = {};
          snapshot.forEach((doc) => {
            progressMap[doc.id] = doc.data() as Progress;
          });
          setUserProgress(progressMap);
        });
        
        // Listen for profile changes (e.g. if another parent updates child info)
        onSnapshot(doc(db, 'users', activeFamilyId), (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        });
      } else {
        setFamilyId(null);
        setProfile(null);
        setUserProgress({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGenerateSyncCode = async () => {
    if (!user || !familyId) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await setDoc(doc(db, 'syncCodes', code), {
      familyId: familyId,
      createdAt: new Date().toISOString()
    });
    setGeneratedCode(code);
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !syncCodeInput) return;
    setSyncMessage(null);
    try {
      const codeSnap = await getDoc(doc(db, 'syncCodes', syncCodeInput.toUpperCase()));
      if (codeSnap.exists()) {
        const newFamilyId = codeSnap.data().familyId;
        await setDoc(doc(db, 'users', user.uid), { linkedFamilyId: newFamilyId }, { merge: true });
        setSyncMessage({ type: 'success', text: 'Successfully linked to family profile!' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncMessage({ type: 'error', text: 'Invalid sync code.' });
      }
    } catch (e) {
      setSyncMessage({ type: 'error', text: 'Error linking family.' });
    }
  };

  const handleUnlinkFamily = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), { linkedFamilyId: null }, { merge: true });
      window.location.reload();
    } catch (e) {
      console.error('Error unlinking family', e);
    }
  };

  const handleCompleteModule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !selectedModule || !familyId) return;
    
    const progressRef = doc(db, 'users', familyId, 'progress', selectedModule.id);
    await setDoc(progressRef, {
      userId: user.uid,
      moduleId: selectedModule.id,
      status: 'completed',
      lastUpdated: new Date().toISOString(),
      moduleTitle: selectedModule.title,
      keyConcept: selectedModule.keyConcept,
      reflections: reflectionText
    });
    
    // Update profile completed list
    const profileRef = doc(db, 'users', familyId);
    const updatedCompleted = [...(profile?.completedModules || [])];
    if (!updatedCompleted.includes(selectedModule.id)) {
      updatedCompleted.push(selectedModule.id);
      await setDoc(profileRef, { ...profile, completedModules: updatedCompleted }, { merge: true });
      setProfile(prev => prev ? { ...prev, completedModules: updatedCompleted } : null);
    }
    
    setShowReflectionModal(false);
    setReflectionText('');
    setView('library');
  };

  const handlePlayAudio = async (text: string) => {
    if (audioSource) {
      audioSource.stop();
      setAudioSource(null);
      return;
    }
    
    setIsGeneratingAudio(true);
    try {
      const base64 = await generateAudio(text);
      if (base64) {
        const binary = atob(base64);
        const bytes = new Int16Array(binary.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          const byte1 = binary.charCodeAt(i * 2);
          const byte2 = binary.charCodeAt(i * 2 + 1);
          bytes[i] = (byte2 << 8) | byte1;
        }
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = audioCtx.createBuffer(1, bytes.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bytes.length; i++) {
          channelData[i] = bytes[i] / 32768.0;
        }
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => setAudioSource(null);
        source.start();
        setAudioSource(source);
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      alert("Failed to generate audio. Please try again.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Calculate Analytics Data
  const conceptCounts: Record<string, number> = {};
  const recentReflections: Progress[] = [];
  
  Object.values(userProgress).forEach(p => {
    if (p.status === 'completed') {
      if (p.keyConcept) {
        conceptCounts[p.keyConcept] = (conceptCounts[p.keyConcept] || 0) + 1;
      }
      if (p.reflections) {
        recentReflections.push(p);
      }
    }
  });
  
  recentReflections.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  
  const radarData = Object.entries(conceptCounts).map(([concept, count]) => ({
    concept,
    score: count * 20 // Scaled for visual representation
  }));

  const handleGenerateCustomModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situationTopic.trim() || !profile) return;
    
    setIsGenerating(true);
    try {
      const generatedData = await generateModuleContent(
        situationTopic, 
        profile.currentTrack || 'foundations', 
        profile.childAge || 8
      );
      
      const customModule: Module = {
        id: `custom-${Date.now()}`,
        track: profile.currentTrack || 'foundations',
        ...generatedData
      };
      
      setSelectedModule(customModule);
      setView('module');
      setSituationTopic('');
    } catch (error) {
      console.error("Failed to generate module:", error);
      alert(`Failed to generate custom module: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Compass className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex p-4 bg-card rounded-full shadow-sm mb-4 border border-border">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-5xl font-display text-foreground leading-tight">
              Lumina
            </h1>
            <p className="text-muted-foreground text-lg serif">
              Clarity for the Journey. Foundations for ages 5-10, Expeditions for 11-16.
            </p>
          </div>
          
          <Button onClick={signIn} className="w-full py-4 text-lg">
            Start the Adventure
          </Button>
          
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Parental Guidance Recommended
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-background/50 backdrop-blur-xl z-50 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-display hidden sm:block">Lumina</h1>
        </div>
        
        <nav className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setView('library')} className={cn(view === 'library' && 'bg-accent')}>
            <MapIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setView('situation-room')} className={cn(view === 'situation-room' && 'bg-accent')}>
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">Situation Room</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setView('analytics')} className={cn(view === 'analytics' && 'bg-accent')}>
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Growth</span>
          </Button>
        </nav>

        <div className="flex items-center gap-4">
          {!user && (
            <Button size="sm" onClick={signIn} variant="outline">Test Sign In</Button>
          )}
          <button 
            onClick={() => setView('profile')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border hover:bg-accent transition-colors"
          >
            <UserIcon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{profile?.childName || 'Setup Profile'}</span>
          </button>
          <button onClick={logOut} className="p-2 text-muted-foreground hover:text-foreground">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8">
        <AnimatePresence mode="wait">
          {view === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="space-y-2">
                <h2 className="text-4xl font-display text-foreground">
                  Your Learning Library
                </h2>
                <p className="text-muted-foreground serif text-lg italic">
                  Explore modules to build core skills and navigate new challenges.
                </p>
              </div>

              {/* Getting Started Card */}
              <Card className="bg-primary/5 border-primary/20">
                <h3 className="text-xl font-display text-foreground mb-2">How to use Lumina</h3>
                <p className="text-muted-foreground text-sm">
                  1. Browse the library for a topic that resonates with you or your child.<br/>
                  2. Read the story together and try the suggested activity.<br/>
                  3. Reflect on the experience to track growth over time.
                </p>
              </Card>

              <div className="space-y-8">
                {['foundations', 'expeditions'].map(track => (
                  <div key={track} className="space-y-4">
                    <h3 className="text-2xl font-display text-foreground capitalize">{track}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {INITIAL_MODULES.filter(m => m.track === track).map((module, index) => {
                        const isCompleted = profile?.completedModules.includes(module.id);
                        const ArtifactIcon = IconMap[module.artifactIcon || 'Star'] || Star;

                        return (
                          <motion.div 
                            key={module.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card 
                              className={cn(
                                "h-full flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
                                isCompleted && "border-primary bg-primary/5"
                              )}
                              onClick={() => setSelectedModule(module)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="p-3 bg-secondary rounded-2xl text-primary">
                                  <ArtifactIcon className="w-6 h-6" />
                                </div>
                                {isCompleted && (
                                  <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Secured
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                  {module.category}
                                </span>
                                <h3 className="text-xl font-display text-foreground">{module.title}</h3>
                                <p className="text-muted-foreground text-sm line-clamp-2">{module.description}</p>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'module' && selectedModule && (
            <motion.div
              key="module"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <button 
                onClick={() => setView('library')}
                className="flex items-center gap-2 text-earth-500 hover:text-earth-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Map
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                    {selectedModule.category}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground serif italic">{selectedModule.keyConcept}</span>
                </div>
                <h2 className="text-5xl font-display leading-tight text-foreground">{selectedModule.title}</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Story Section */}
                  <Card className="prose prose-stone max-w-none">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-primary">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-widest text-sm">The Story</span>
                      </div>
                      
                      {/* Audio Player Button */}
                      <button 
                        onClick={() => handlePlayAudio(selectedModule.content)}
                        disabled={isGeneratingAudio}
                        className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full text-sm font-medium transition-colors"
                      >
                        {isGeneratingAudio ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : audioSource ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                        {audioSource ? 'Stop Audio' : 'School Run Mode (Audio)'}
                      </button>
                    </div>
                    <div className="markdown-body">
                      <Markdown>{selectedModule.content}</Markdown>
                    </div>
                  </Card>

                  {/* Activity Section */}
                  <Card className="bg-primary text-primary-foreground border-none">
                    <div className="flex items-center gap-2 mb-6 opacity-80">
                      <Star className="w-5 h-5" />
                      <span className="font-bold uppercase tracking-widest text-sm text-primary-foreground">Let's Do It!</span>
                    </div>
                    <div className="markdown-body prose-invert">
                      <Markdown>{selectedModule.activity}</Markdown>
                    </div>
                  </Card>
                </div>

                <div className="space-y-8">
                  {/* Parent Guide */}
                  <Card className="bg-secondary border-none sticky top-24">
                    <div className="flex items-center gap-2 mb-6 text-secondary-foreground">
                      <Heart className="w-5 h-5" />
                      <span className="font-bold uppercase tracking-widest text-sm">Parent's Guide</span>
                    </div>
                    <div className="markdown-body text-secondary-foreground text-sm">
                      <Markdown>{selectedModule.parentGuide}</Markdown>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-border">
                      <Button 
                        onClick={() => setShowReflectionModal(true)}
                        className="w-full"
                      >
                        Complete & Reflect
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Reflection Modal */}
              <AnimatePresence>
                {showReflectionModal && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-earth-900/60 backdrop-blur-sm"
                  >
                    <motion.div 
                      initial={{ scale: 0.95, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 20 }}
                      className="w-full max-w-lg"
                    >
                      <Card className="shadow-2xl">
                        <h3 className="text-2xl font-display mb-2">Module Reflection</h3>
                        <p className="text-earth-600 mb-6">How did {profile?.childName || 'your child'} react to this lesson? Your notes will appear in the Growth Report.</p>
                        
                        <form onSubmit={handleCompleteModule} className="space-y-6">
                          <textarea 
                            value={reflectionText}
                            onChange={(e) => setReflectionText(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-earth-50 border border-earth-200 focus:outline-none focus:border-nature-500 transition-colors min-h-[100px] resize-none"
                            placeholder="e.g., They really connected with the metaphor, but struggled to think of an example..."
                            required
                          />
                          <div className="flex gap-3">
                            <Button type="submit" className="flex-1">Save & Complete</Button>
                            <Button variant="ghost" onClick={() => setShowReflectionModal(false)}>Cancel</Button>
                          </div>
                        </form>
                      </Card>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {view === 'situation-room' && (
            <motion.div
              key="situation-room"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-card border-none shadow-xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary rounded-full blur-3xl opacity-10 pointer-events-none" />
                
                <div className="relative z-10 space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                      <Sparkles className="w-3 h-3" />
                      Premium Feature
                    </div>
                    <h2 className="text-4xl font-display text-foreground">The Situation Room</h2>
                    <p className="text-muted-foreground serif text-lg italic">
                      Facing a specific challenge? Tell us what's happening, and our AI will instantly generate a custom, age-appropriate lesson and discussion guide just for your child.
                    </p>
                  </div>

                  <form onSubmit={handleGenerateCustomModule} className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Describe the situation
                      </label>
                      <textarea 
                        value={situationTopic}
                        onChange={(e) => setSituationTopic(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors min-h-[120px] resize-none"
                        placeholder="e.g., 'Alex is terrified of an upcoming math test and says he is stupid.' or 'Sarah is dealing with exclusion from her friend group at school.'"
                        required
                        disabled={isGenerating}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-lg"
                      disabled={isGenerating || !situationTopic.trim()}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Consulting Experts...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Custom Module
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </Card>
            </motion.div>
          )}

          {view === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
                  <BarChart2 className="w-3 h-3" />
                  Premium Feature
                </div>
                <h2 className="text-4xl font-display text-foreground">Growth Report</h2>
                <p className="text-muted-foreground serif text-lg italic">
                  Tracking {profile?.childName || 'your child'}'s emotional and personal development.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="flex flex-col items-center justify-center min-h-[300px]">
                  <h3 className="text-xl font-display mb-6 self-start text-foreground">Concept Mastery</h3>
                  {radarData.length > 0 ? (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="concept" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Mastery" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">Complete modules to see the mastery chart.</p>
                  )}
                </Card>

                <div className="space-y-6">
                  <h3 className="text-2xl font-display text-foreground">Recent Reflections</h3>
                  {recentReflections.length > 0 ? (
                    <div className="space-y-4">
                      {recentReflections.slice(0, 3).map((ref, i) => (
                        <Card key={i} className="p-6 rounded-2xl">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-foreground">{ref.moduleTitle}</h4>
                            <span className="text-xs text-muted-foreground">{new Date(ref.lastUpdated).toLocaleDateString()}</span>
                          </div>
                          <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs mb-3">
                            {ref.keyConcept}
                          </span>
                          <p className="text-muted-foreground text-sm italic">"{ref.reflections}"</p>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-6 rounded-2xl bg-secondary border-dashed">
                      <p className="text-muted-foreground italic text-center">No reflections yet. Complete a module to add your first note!</p>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <h2 className="text-4xl font-display text-center text-foreground">Profile & Settings</h2>
              
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display text-foreground">{profile?.childName || 'Child Profile'}</h3>
                    <p className="text-muted-foreground">Age: {profile?.childAge || 'Not set'}</p>
                  </div>
                </div>

                {/* The Field Kit / Inventory */}
                <div className="mb-8 pb-8 border-b border-border">
                  <h4 className="text-lg font-bold uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    {profile?.currentTrack === 'foundations' ? "The Inventory" : "The Field Kit"}
                  </h4>
                  <p className="text-muted-foreground text-sm mb-4 italic">
                    Artifacts collected from completed modules.
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    {INITIAL_MODULES.filter(m => profile?.completedModules.includes(m.id)).length > 0 ? (
                      INITIAL_MODULES.filter(m => profile?.completedModules.includes(m.id)).map(module => {
                        const ArtifactIcon = IconMap[module.artifactIcon || 'Star'] || Star;
                        return (
                          <div key={module.id} className="flex flex-col items-center gap-2 w-20">
                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-sm transform transition-transform hover:scale-110 hover:rotate-3 cursor-help" title={module.title}>
                              <ArtifactIcon className="w-8 h-8" />
                            </div>
                            <span className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-tighter leading-tight">
                              {module.keyConcept}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full p-6 border-2 border-dashed border-border rounded-2xl text-center text-muted-foreground italic">
                        Your kit is empty. Start your journey to collect artifacts!
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-display text-foreground">Student Profile</h2>
                    <p className="text-muted-foreground serif italic">Customize the curriculum path.</p>
                  </div>

                  <form className="space-y-6" onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const childName = formData.get('childName') as string;
                  const childAge = parseInt(formData.get('childAge') as string);
                  const currentTrack = formData.get('currentTrack') as 'foundations' | 'expeditions';
                  
                  if (user && familyId) {
                    const profileRef = doc(db, 'users', familyId);
                    await setDoc(profileRef, { childName, childAge, currentTrack }, { merge: true });
                    setProfile(prev => prev ? { ...prev, childName, childAge, currentTrack } : null);
                    setView('library');
                  }
                }}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Student's Name</label>
                    <input 
                      name="childName"
                      defaultValue={profile?.childName}
                      className="w-full px-6 py-4 rounded-2xl bg-secondary border border-border focus:outline-none focus:border-primary transition-colors"
                      placeholder="e.g. Alex"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Student's Age</label>
                    <input 
                      name="childAge"
                      type="number"
                      min="5"
                      max="16"
                      defaultValue={profile?.childAge}
                      className="w-full px-6 py-4 rounded-2xl bg-secondary border border-border focus:outline-none focus:border-primary transition-colors"
                      placeholder="5-16"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Curriculum Track</label>
                    <select 
                      name="currentTrack"
                      defaultValue={profile?.currentTrack || 'foundations'}
                      className="w-full px-6 py-4 rounded-2xl bg-secondary border border-border focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="foundations">Foundations (Ages 5-10)</option>
                      <option value="expeditions">Expeditions (Ages 11-16)</option>
                    </select>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button type="submit" className="flex-1">Save Profile</Button>
                    <Button variant="ghost" onClick={() => setView('library')}>Cancel</Button>
                  </div>
                </form>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-12 pt-8 border-t border-border space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-display text-foreground">Family Sync</h3>
                    <p className="text-muted-foreground serif italic text-sm">Link another parent or guardian to this profile.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-secondary p-6 rounded-2xl space-y-4"
                    >
                      <h4 className="font-bold text-foreground">Share This Profile</h4>
                      <p className="text-sm text-muted-foreground">Generate a code to let someone else sync with this student's progress.</p>
                      {generatedCode ? (
                        <motion.div 
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="bg-card p-4 rounded-xl text-center border border-border"
                        >
                          <span className="text-2xl font-mono font-bold tracking-widest text-primary">{generatedCode}</span>
                          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">Valid for 24 hours</p>
                        </motion.div>
                      ) : (
                        <Button variant="outline" onClick={handleGenerateSyncCode} className="w-full">
                          Generate Sync Code
                        </Button>
                      )}
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-secondary p-6 rounded-2xl space-y-4"
                    >
                      <h4 className="font-bold text-foreground">Join a Profile</h4>
                      {user && familyId && user.uid !== familyId ? (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">You are currently linked to another family's profile.</p>
                          <Button variant="outline" onClick={handleUnlinkFamily} className="w-full text-destructive border-destructive/20 hover:bg-destructive/10">
                            Unlink Profile
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">Enter a code provided by another parent to sync with their student.</p>
                          <form onSubmit={handleJoinFamily} className="space-y-3">
                            <input
                              value={syncCodeInput}
                              onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
                              placeholder="ENTER 6-DIGIT CODE"
                              className="w-full px-4 py-3 rounded-xl bg-card border border-border focus:outline-none focus:border-primary text-center font-mono font-bold tracking-widest uppercase"
                              maxLength={6}
                            />
                            <Button type="submit" className="w-full" disabled={syncCodeInput.length < 6}>
                              Sync Profile
                            </Button>
                            {syncMessage && (
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={cn("text-sm text-center font-medium", syncMessage.type === 'error' ? "text-destructive" : "text-primary")}
                              >
                                {syncMessage.text}
                              </motion.p>
                            )}
                          </form>
                        </>
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Rail (Mobile) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-md border border-border rounded-full px-8 py-4 shadow-lg flex items-center gap-8 sm:gap-12 z-50">
        <button 
          onClick={() => setView('library')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            view === 'library' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MapIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Map</span>
        </button>

        <button 
          onClick={() => setView('situation-room')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors relative",
            view === 'situation-room' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          <Sparkles className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Custom</span>
        </button>
        
        <button 
          onClick={() => setView('analytics')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors relative",
            view === 'analytics' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          <BarChart2 className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Growth</span>
        </button>
        
        <button 
          onClick={() => setView('profile')}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            view === 'profile' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
        </button>
      </nav>
    </div>
  );
}
