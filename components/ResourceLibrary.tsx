
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

const ResourceLibrary: React.FC = () => {
  const { t } = useTranslation();
  const categories = t('resourceLibrary.categories') as Record<string, { title: string; resources: { title: string; description: string; link: string }[] }>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">{t('resourceLibrary.title')}</h2>
      <p className="text-slate-500 mb-8">{t('resourceLibrary.description')}</p>
      
      <div className="space-y-8">
        {Object.keys(categories).map(categoryKey => {
          const category = categories[categoryKey];
          return (
            <div key={category.title}>
                <h3 className="text-xl font-bold text-sky-700 mb-4 pb-2 border-b-2 border-sky-200">{category.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.resources.map(article => (
                        <a 
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          key={article.title} 
                          className="block bg-white p-5 rounded-xl shadow-md border border-slate-100 hover:shadow-lg hover:border-sky-200 transition-all duration-200"
                        >
                            <h4 className="font-bold text-slate-800 mb-1">{article.title}</h4>
                            <p className="text-sm text-slate-500">{article.description}</p>
                        </a>
                    ))}
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourceLibrary;