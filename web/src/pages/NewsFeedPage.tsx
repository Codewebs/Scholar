import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Megaphone,
  Globe,
  Users,
  Image as ImageIcon,
  Send,
  MoreHorizontal,
  Bookmark,
  Share2,
  Settings
} from 'lucide-react';
import { clsx } from 'clsx';
import AuthButton from '../components/ui/AuthButton';

interface Annonce {
    idAnnonce: number;
    contenu: string;
    image?: string;
    nomAuteur: string;
    posteAuteur: string;
    datePublication: string;
    nomEtablissement?: string;
    villeEtablissement?: string;
}

const NewsFeedPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'community' | 'public'>('community');
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(false);
  const [postText, setPostText] = useState('');

  const currentSchoolId = Number(localStorage.getItem('school_id') || 0);

  useEffect(() => {
    loadAnnonces();
  }, [selectedTab, currentSchoolId]);

  const loadAnnonces = async () => {
    setLoading(true);
    try {
      const url = selectedTab === 'community'
        ? `/annonces/communaute/${currentSchoolId}`
        : `/annonces/publiques`;
      const res = await api.get(url);
      setAnnonces(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const canPost = user && !user.role.includes('PARENT') && !user.role.includes('ELEVE');

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black uppercase tracking-tighter">News Feed</h1>
        <button className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-border">
          <Settings size={22} className="text-black" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-soft w-full">
        <button
          onClick={() => setSelectedTab('community')}
          className={clsx(
            "flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-black uppercase tracking-widest rounded-soft transition-all",
            selectedTab === 'community' ? "bg-white text-black shadow-lg" : "text-secondary hover:text-black"
          )}
        >
          <Users size={16} />
          <span>Community</span>
        </button>
        <button
          onClick={() => setSelectedTab('public')}
          className={clsx(
            "flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-black uppercase tracking-widest rounded-soft transition-all",
            selectedTab === 'public' ? "bg-white text-black shadow-lg" : "text-secondary hover:text-black"
          )}
        >
          <Globe size={16} />
          <span>Public</span>
        </button>
      </div>

      {/* Publish Section */}
      {canPost && selectedTab === 'community' && (
        <div className="card p-6 space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center text-lg font-black rounded-full shrink-0">
              {user.nom.charAt(0)}
            </div>
            <textarea
              className="flex-1 bg-gray-50 border-none rounded-soft p-4 text-sm font-medium focus:ring-1 focus:ring-accent outline-none min-h-[100px] transition-all"
              placeholder="What's new in the school?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button className="flex items-center space-x-2 text-[#9E9E9E] hover:text-black transition-colors font-bold text-xs uppercase tracking-widest">
              <ImageIcon size={18} />
              <span>Image</span>
            </button>
            <AuthButton
              className="h-10 px-6 w-auto"
              disabled={!postText.trim()}
              onClick={() => { /* API call to post */ }}
            >
              <Send size={16} className="mr-2" /> Post
            </AuthButton>
          </div>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="p-20 text-center animate-pulse uppercase font-black tracking-widest text-[#9E9E9E]">Loading feed...</div>
      ) : (
        <div className="space-y-8">
          {annonces.map((annonce) => (
            <div key={annonce.idAnnonce} className="card overflow-hidden group">
               <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                       <div className={clsx(
                         "w-12 h-12 flex items-center justify-center text-lg font-black rounded-full shadow-lg",
                         selectedTab === 'public' ? "bg-accent text-white" : "bg-gray-100 text-black"
                       )}>
                         {annonce.nomAuteur?.charAt(0) || 'S'}
                       </div>
                       <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">
                            {selectedTab === 'public' ? (annonce.nomEtablissement || 'Scholar') : annonce.nomAuteur}
                          </h3>
                          <p className="text-[10px] font-bold text-[#9E9E9E] uppercase tracking-widest">
                            {selectedTab === 'public' ? `${annonce.villeEtablissement || 'City'}` : annonce.posteAuteur} • 3min
                          </p>
                       </div>
                    </div>
                    <button className="text-[#9E9E9E] hover:text-black transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <p className="text-sm font-medium leading-relaxed text-black/80 whitespace-pre-line">
                    {annonce.contenu}
                  </p>
               </div>

               {annonce.image && (
                 <div className="w-full h-80 bg-gray-100 overflow-hidden">
                    <img
                      src={annonce.image}
                      alt="Publication"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                 </div>
               )}

               <div className="px-6 py-4 flex items-center justify-between border-t border-gray-50">
                  <div className="flex items-center space-x-6">
                     {/* Rare Violet Accent: Interaction counts */}
                     <button className="flex items-center space-x-2 text-[#9E9E9E] hover:text-accent transition-colors font-black text-[10px] uppercase tracking-widest">
                        <Megaphone size={16} />
                        <span>Alert</span>
                     </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-[#9E9E9E] hover:text-black transition-colors"><Bookmark size={18} /></button>
                    <button className="p-2 text-[#9E9E9E] hover:text-black transition-colors"><Share2 size={18} /></button>
                  </div>
               </div>
            </div>
          ))}

          {annonces.length === 0 && (
            <div className="p-20 text-center card flex flex-col items-center justify-center space-y-4">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                  <Megaphone size={32} className="text-[#9E9E9E]" />
               </div>
               <p className="text-sm font-black uppercase tracking-widest text-[#9E9E9E]">No news at the moment</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsFeedPage;
