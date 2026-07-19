// src/utils/systemTemplates.js

// Helper to wrap raw HTML into your builder's native JSON format
const wrapHtmlToLayout = (htmlString) => {
  return JSON.stringify([{
    id: `element_${Date.now()}_root`,
    type: 'div',
    customId: `system-template`,
    parentId: null,
    text: '',
    styles: { width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    tabletStyles: {}, mobileStyles: {},
    rawHtml: htmlString.trim(),
    isRawChild: false
  }]);
};

export const systemTemplates = [
  {
    id: 'sys_hero_01',
    name: 'Modern SaaS Hero',
    description: 'A dark-themed hero section with a gradient headline and call-to-action buttons.',
    icon: 'bi-window-desktop',
    authorId: 'system', // Prevents editing/deleting
    createdAt: Date.now(),
    layouts: wrapHtmlToLayout(`
      <div class="w-full min-h-[80vh] bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
        <h1 class="text-5xl md:text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight">
          Build Faster. Scale Better.
        </h1>
        <p class="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          The ultimate platform for creating stunning digital experiences without writing a single line of backend code.
        </p>
        <div class="flex gap-4">
          <button class="px-8 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-500/30 transition-all">Get Started Free</button>
          <button class="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full font-bold transition-all">View Documentation</button>
        </div>
      </div>
    `)
  },
  {
    id: 'sys_pricing_01',
    name: 'Clean Pricing Cards',
    description: 'A 3-tier pricing section perfect for subscription businesses.',
    icon: 'bi-tags',
    authorId: 'system',
    createdAt: Date.now(),
    layouts: wrapHtmlToLayout(`
      <div class="w-full py-20 bg-gray-50 flex flex-col items-center">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p class="text-gray-500">Choose the plan that best fits your needs.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-6">
          <!-- Card 1 -->
          <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <h3 class="text-xl font-bold text-gray-800 mb-2">Starter</h3>
            <div class="text-4xl font-extrabold text-gray-900 mb-6">$0<span class="text-base text-gray-500 font-medium">/mo</span></div>
            <ul class="space-y-4 mb-8 flex-1 text-gray-600 text-sm">
              <li><i class="bi bi-check2 text-green-500 mr-2"></i> 1 Project</li>
              <li><i class="bi bi-check2 text-green-500 mr-2"></i> Basic Analytics</li>
            </ul>
            <button class="w-full py-3 rounded-xl font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">Start Free</button>
          </div>
          <!-- Card 2 -->
          <div class="bg-indigo-600 p-8 rounded-3xl shadow-xl flex flex-col text-white transform md:-translate-y-4 relative">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full">Most Popular</div>
            <h3 class="text-xl font-bold text-indigo-100 mb-2">Pro</h3>
            <div class="text-4xl font-extrabold mb-6">$29<span class="text-indigo-200 text-base font-medium">/mo</span></div>
            <ul class="space-y-4 mb-8 flex-1 text-indigo-100 text-sm">
              <li><i class="bi bi-check2 text-white mr-2"></i> Unlimited Projects</li>
              <li><i class="bi bi-check2 text-white mr-2"></i> Advanced Analytics</li>
              <li><i class="bi bi-check2 text-white mr-2"></i> Priority Support</li>
            </ul>
            <button class="w-full py-3 rounded-xl font-bold bg-white text-indigo-600 hover:bg-gray-50 transition-colors">Upgrade to Pro</button>
          </div>
          <!-- Card 3 -->
          <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
            <h3 class="text-xl font-bold text-gray-800 mb-2">Enterprise</h3>
            <div class="text-4xl font-extrabold text-gray-900 mb-6">$99<span class="text-base text-gray-500 font-medium">/mo</span></div>
            <ul class="space-y-4 mb-8 flex-1 text-gray-600 text-sm">
              <li><i class="bi bi-check2 text-green-500 mr-2"></i> Everything in Pro</li>
              <li><i class="bi bi-check2 text-green-500 mr-2"></i> Custom Integrations</li>
            </ul>
            <button class="w-full py-3 rounded-xl font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">Contact Sales</button>
          </div>
        </div>
      </div>
    `)
  }
];