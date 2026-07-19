import React, { useState } from 'react';

export default function DashboardTemplates({ allTemplates, handleClone, handleDeleteTemplate, currentUid, navigate }) {
  const [templatePage, setTemplatePage] = useState(1);
  const TEMPLATES_PER_PAGE = 9;

  const totalPages = Math.ceil(allTemplates.length / TEMPLATES_PER_PAGE);
  const paginated = allTemplates.slice((templatePage - 1) * TEMPLATES_PER_PAGE, templatePage * TEMPLATES_PER_PAGE);

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">Template Library</h1>
          <p className="text-slate-500">Preview system templates or clone community builds.</p>
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center"><i className="bi bi-inboxes text-4xl mb-3 block opacity-50"></i><p className="font-semibold">No templates available.</p></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map(template => {
              const isSystem = template.authorId === 'system';
              const isAuthor = !isSystem && currentUid === template.authorId;
              
              return (
                <div key={template.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col relative overflow-hidden group">
                  {isSystem && <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">System</div>}
                  {isAuthor && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/deploy-template?edit=${template.id}`); }} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-100"><i className="bi bi-pencil-fill text-xs"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }} className="w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center shadow-sm hover:bg-red-100"><i className="bi bi-trash-fill text-xs"></i></button>
                    </div>
                  )}
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl mb-4 shadow-inner"><i className={`bi ${template.icon || 'bi-layout-wtf'}`}></i></div>
                  <h3 className="font-bold text-slate-800 text-lg mb-2 pr-12">{template.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1 line-clamp-3">{template.description}</p>
                  
                  <button onClick={() => handleClone(template)} className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
                    <i className="bi bi-magic"></i> Clone & Preview
                  </button>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-slate-200">
               <button disabled={templatePage === 1} onClick={() => setTemplatePage(p => p - 1)} className="w-10 h-10 rounded-full font-bold bg-white border border-slate-300 hover:bg-slate-50 shadow-sm disabled:opacity-50"><i className="bi bi-chevron-left"></i></button>
               <span className="text-sm font-bold text-slate-600">Page {templatePage} of {totalPages}</span>
               <button disabled={templatePage === totalPages} onClick={() => setTemplatePage(p => p + 1)} className="w-10 h-10 rounded-full font-bold bg-white border border-slate-300 hover:bg-slate-50 shadow-sm disabled:opacity-50"><i className="bi bi-chevron-right"></i></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}