import React from 'react';
import { Link } from 'react-router-dom';

export default function Home({ user }) {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* 🚀 1. FLOATING NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="bi bi-lightning-charge-fill text-white text-xl"></i>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">EmTeeCanvas</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#community" className="hover:text-indigo-400 transition-colors">Community</a>
            <a href="#about" className="hover:text-indigo-400 transition-colors">About</a>
          </div>
          <div>
            {user ? (
              <Link to="/user/home" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-full transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/authentication" className="px-6 py-2.5 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10 text-white text-sm font-bold rounded-full transition-all">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* 🌌 2. HERO SECTION */}
      <section className="relative pt-40 pb-20 md:pt-52 md:pb-32 px-6 flex flex-col items-center justify-center text-center">
        {/* Futuristic Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            The Next Generation Builder
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight leading-[1.1]">
            Engineer the web at <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Lightning Speed.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto">
            The ultimate visual workspace. Design responsive interfaces, manipulate complex DOM trees, deploy templates, and generate production-ready code instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            {user ? (
              <Link to="/user/home" className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:bg-indigo-500 hover:scale-105 transition-all text-lg flex items-center justify-center gap-2">
                Enter Workspace <i className="bi bi-arrow-right"></i>
              </Link>
            ) : (
              <>
                <Link to="/authentication" className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:bg-indigo-500 hover:-translate-y-1 transition-all text-lg">
                  Start Building Free
                </Link>
                <Link to="/authentication" className="w-full sm:w-auto px-10 py-4 bg-transparent border-2 border-slate-700 text-slate-300 font-bold rounded-full hover:border-slate-500 hover:text-white hover:-translate-y-1 transition-all text-lg">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 🛠️ 3. CORE FEATURES GRID */}
      <section id="features" className="py-24 bg-slate-900/50 border-y border-slate-800/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">A Powerhouse of Design</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to go from an idea to a pixel-perfect, fully functional interface in minutes, not hours.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon="bi-bounding-box-circles" 
              title="Visual Canvas Engine" 
              desc="Click, interact, and inspect elements directly on a highly responsive sandbox viewport. Visual design has never felt this natural." 
            />
            <FeatureCard 
              icon="bi-palette-fill" 
              title="Precision CSS Inspector" 
              desc="Micro-manage flexbox, grids, typography, custom margins, and borders visually without writing a single line of CSS code." 
            />
            <FeatureCard 
              icon="bi-phone-flip" 
              title="Dynamic Breakpoints" 
              desc="Apply distinct, tailored styles across Desktop, Tablet, and Mobile views to guarantee flawless pixel-perfect layouts on any device." 
            />
            <FeatureCard 
              icon="bi-diagram-3" 
              title="Live DOM Tree" 
              desc="Retain full structural control. Duplicate, reorder, and meticulously manage parent-child relationships through the intuitive DOM view." 
            />
            <FeatureCard 
              icon="bi-layers-fill" 
              title="Community Templates" 
              desc="Stop starting from scratch. Kickstart your workspace by cloning stunning SaaS, Portfolio, and Dashboard templates built by the community." 
            />
            <FeatureCard 
              icon="bi-filetype-html" 
              title="Raw Code & Overrides" 
              desc="Need ultimate control? Dive directly into the integrated code editor to inject raw HTML or custom CSS styling into any node." 
            />
            <FeatureCard 
              icon="bi-cloud-arrow-up" 
              title="Cloud Synchronization" 
              desc="Never lose your progress. Every design tweak is saved automatically and synced to your secure Firebase cloud database in real-time." 
            />
            <FeatureCard 
              icon="bi-download" 
              title="Production HTML Export" 
              desc="Once your layout is perfected, export your creation into beautifully formatted, production-ready HTML infused with Tailwind CSS." 
            />
            <FeatureCard 
              icon="bi-broadcast-pin" 
              title="Global Notifications" 
              desc="Stay connected. Our real-time notification engine keeps you updated on community updates, template deployments, and admin alerts." 
            />
          </div>
        </div>
      </section>

      {/* 🌍 4. COMMUNITY & TIERS */}
      <section id="community" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold uppercase tracking-widest mb-6 border border-pink-500/20">
                <i className="bi bi-globe-americas"></i> Global Ecosystem
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Explore, Clone, and <br/>Deploy to the World.
              </h2>
              <p className="text-slate-400 mb-8 text-lg leading-relaxed">
                EmTeeCanvas isn't just an editor; it's a living ecosystem. Deploy your masterfully crafted components as public templates, or explore the Community Tab to clone layouts built by thousands of other developers.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-300 text-xl"><i className="bi bi-person"></i></div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Normal Users</h4>
                    <p className="text-slate-400 text-sm">Perfect for beginners. Manage up to 3 active workspaces, keep 1 private, and explore the global community.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 text-xl border border-amber-500/30"><i className="bi bi-star-fill"></i></div>
                  <div>
                    <h4 className="text-amber-400 font-bold text-lg">Pro Members</h4>
                    <p className="text-slate-400 text-sm">For active creators. Manage up to 10 active workspaces, set unlimited private projects, and unlock HTML source code exports.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-400 text-xl border border-purple-500/30"><i className="bi bi-code-square"></i></div>
                  <div>
                    <h4 className="text-purple-400 font-bold text-lg">Developers & Admins</h4>
                    <p className="text-slate-400 text-sm">No limits. Unlimited workspaces, template deployment authority, API access, and deep community administration tools.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual Decorative Element */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <pre className="text-sm font-mono text-emerald-400 overflow-hidden">
                  <code>
                    <span className="text-pink-400">const</span> workspace = {'{\n'}
                    {'  '}name: <span className="text-amber-300">"SaaS Hero Section"</span>,\n
                    {'  '}isPublic: <span className="text-purple-400">true</span>,\n
                    {'  '}authorRole: <span className="text-amber-300">"Pro"</span>,\n
                    {'  '}likes: <span className="text-purple-400">1,204</span>\n
                    {'}'};\n\n
                    <span className="text-slate-500">// Deploying to the network...</span>\n
                    <span className="text-blue-400">await</span> EmTeeCanvas.<span className="text-yellow-200">deploy</span>(workspace);
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 👨‍💻 5. ABOUT THE CREATOR */}
      <section id="about" className="py-24 bg-slate-900 border-t border-slate-800 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full p-1 mb-8 shadow-xl shadow-indigo-500/20">
             <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
               <i className="bi bi-person-bounding-box text-3xl text-white"></i>
             </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Architected by <span className="text-indigo-400">Tabrez</span></h2>
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <i className="bi bi-quote absolute top-4 left-6 text-6xl text-slate-800/50"></i>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed relative z-10 font-medium">
              "Driven by a relentless passion for clean code and seamless digital creation, I built EmTeeCanvas to bridge the gap between imagination and reality. This platform is designed to empower developers, designers, and visionaries to stop wrestling with setup, and start engineering the future."
            </p>
            <div className="mt-8 flex items-center justify-center gap-4 text-slate-500">
               <span className="w-12 h-px bg-slate-700"></span>
               <span className="font-bold text-sm tracking-widest uppercase">Lead Developer</span>
               <span className="w-12 h-px bg-slate-700"></span>
            </div>
          </div>
        </div>
      </section>

      {/* 🏁 6. FOOTER */}
      <footer className="bg-slate-950 py-12 border-t border-slate-900 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center"><i className="bi bi-lightning-charge-fill text-white text-[10px]"></i></div>
          <span className="font-bold text-slate-200">EmTeeCanvas</span>
        </div>
        <p className="text-slate-600 text-sm">© {new Date().getFullYear()} Created by Tabrez. All rights reserved.</p>
      </footer>
    </div>
  );
}

// 🧩 Helper Component for the Features Grid
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
      <div className="w-12 h-12 bg-slate-900 border border-slate-700 group-hover:border-indigo-500 text-indigo-400 group-hover:text-indigo-300 rounded-xl flex items-center justify-center text-xl mb-5 shadow-inner transition-colors relative z-10">
        <i className={`bi ${icon}`}></i>
      </div>
      <h3 className="text-lg font-bold text-white mb-2 relative z-10">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed relative z-10">{desc}</p>
    </div>
  );
}