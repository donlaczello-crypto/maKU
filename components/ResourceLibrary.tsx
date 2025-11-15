
import React from 'react';

const resources = {
    'ASD': [
        { title: 'Zrozumieć sensorykę: Przewodnik dla rodziców', description: 'Jak wspierać dziecko z nadwrażliwością lub niedowrażliwością sensoryczną.' },
        { title: 'Wizualne wsparcie w codziennej komunikacji', description: 'Praktyczne przykłady użycia piktogramów i planów dnia.' },
    ],
    'ADHD': [
        { title: 'Techniki zarządzania uwagą i energią', description: 'Sposoby na pomoc dziecku w skupieniu się na zadaniach.' },
        { title: 'Budowanie rutyny, która działa dla dziecka z ADHD', description: 'Jak stworzyć przewidywalne, ale elastyczne ramy dnia.' },
    ],
    'Trauma': [
        { title: 'Okno tolerancji: Jak rozpoznać dysregulację', description: 'Koncepcja okna tolerancji i praktyczne wskazówki do obserwacji.' },
        { title: 'Budowanie poczucia bezpieczeństwa po trudnych przeżyciach', description: 'Kluczowe elementy w procesie leczenia traumy u dzieci.' },
    ],
    'Dla Opiekuna': [
        { title: 'Model ABC w praktyce: Analiza zachowania krok po kroku', description: 'Jak skutecznie wykorzystywać model ABC do zrozumienia funkcji zachowania.' },
        { title: 'Autoregulacja dla dorosłych: Dbaj o siebie, by wspierać dziecko', description: 'Proste techniki oddechowe i mindfulness dla zapracowanych opiekunów.' },
    ]
}

type Category = keyof typeof resources;

const ResourceLibrary: React.FC = () => {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Biblioteka Wiedzy</h2>
      <p className="text-slate-500 mb-8">Przeglądaj artykuły i zasoby, aby pogłębić swoją wiedzę i znaleźć praktyczne wsparcie.</p>
      
      <div className="space-y-8">
        {(Object.keys(resources) as Category[]).map(category => (
            <div key={category}>
                <h3 className="text-xl font-bold text-sky-700 mb-4 pb-2 border-b-2 border-sky-200">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resources[category].map(article => (
                        <div key={article.title} className="bg-white p-5 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow cursor-pointer">
                            <h4 className="font-bold text-slate-800 mb-1">{article.title}</h4>
                            <p className="text-sm text-slate-500">{article.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceLibrary;